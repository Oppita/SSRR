import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import Papa from 'papaparse';
import { Contract, Pago } from '../types';
import { useProject } from '../store/ProjectContext';

interface ImportPagosCSVProps {
  contracts: Contract[];
  onComplete: () => void;
}

export const ImportPagosCSV: React.FC<ImportPagosCSVProps> = ({ contracts, onComplete }) => {
  const { state, addPagos } = useProject();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const processCSV = () => {
    if (!file) return;

    setIsProcessing(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^"|"$/g, '').replace(/[\n\r]/g, ''),
      complete: (results) => {
        const data = results.data as any[];
        let successCount = 0;
        const errorMessages: string[] = [];
        const pagosToUpload: any[] = [];
        
        // Optimize lookup
        const contractMap = new Map();
        contracts.forEach(c => contractMap.set(c.numero, c.id));
        const firstContractId = contracts.length > 0 ? contracts[0].id : '';

        data.forEach((row, index) => {
          try {
            // Clean keys
            const cleanRow: any = {};
            for (const key in row) {
              const cleanKey = key.trim().replace(/^"|"$/g, '').replace(/[\n\r]/g, '');
              const cleanValue = row[key] && typeof row[key] === 'string' ? row[key].trim().replace(/^"|"$/g, '') : '';
              cleanRow[cleanKey] = cleanValue;
            }

            // Exclude empty rows
            if (Object.keys(cleanRow).length === 0 || (!cleanRow['No.Pago'] && !cleanRow['Valor'])) {
              return;
            }

            // Extract fields based on requested structure
            const numero = cleanRow['No.Pago'] || '';
            const cdp = cleanRow['CDP'] || '';
            const areaEjecutora = cleanRow['Area Ejecutora'] || '';
            const observaciones = cleanRow['Observación'] || '';
            const identificacion = cleanRow['Identificación'] || '';
            const beneficiario = cleanRow['Beneficiario'] || '';
            
            // Clean value (e.g. 757,163.70 -> 757163.70)
            const validateDateStr = (dateStr: string) => {
              if (!dateStr) return '';
              const cleaned = dateStr.replace(/\//g, '-');
              if (cleaned.split('-').length === 3) {
                 const [d, m, y] = cleaned.split('-');
                 if (y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              }
              return cleaned;
            };

            const fecha = cleanRow['Fecha'] ? validateDateStr(cleanRow['Fecha']) : new Date().toISOString().split('T')[0];
            const fechaRadicado = cleanRow['Fecha Radicado'] ? validateDateStr(cleanRow['Fecha Radicado']) : '';
            
            // Robust numeric parsing for Colombian formats (handles . as thousands and , as decimal or vice versa)
            const parseColombianNumber = (str: string) => {
              if (!str) return 0;
              // Remove currency symbols and spaces
              let cleaned = str.replace(/[$\s]/g, '');
              
              // If it contains both . and , (e.g. 1.234,56)
              if (cleaned.includes('.') && cleaned.includes(',')) {
                // Assume , is decimal if it's the last one
                if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
                } else {
                  // Assume . is decimal
                  cleaned = cleaned.replace(/,/g, '');
                }
              } else if (cleaned.includes(',')) {
                // Only comma - check position. If it looks like a decimal separator (like ,00 or ,50)
                const parts = cleaned.split(',');
                if (parts[1] && parts[1].length === 2) {
                   cleaned = parts[0] + '.' + parts[1];
                } else {
                   cleaned = cleaned.replace(',', '');
                }
              }
              
              const val = parseFloat(cleaned) || 0;
              // "no leas los últimos dos decimales" -> Truncate decimals
              return Math.floor(val);
            };

            const valor = parseColombianNumber(cleanRow['Valor']);
            const valorDistribuido = parseColombianNumber(cleanRow['Valor Distribuido']);

            const banco = cleanRow['Banco'] || '';
            const tipoCuenta = cleanRow['Tipo Cuenta'] || '';
            const cuenta = cleanRow['Cuenta'] || '';
            const solicitud = cleanRow['Solicitud'] || '';
            const numeroContratoOriginal = cleanRow['Contrato'] || '';
            const rc = (cleanRow['RC'] || '').trim();
            const resolucion = cleanRow['Resolucion'] || '';
            const fuente = cleanRow['Fuente'] || '';
            const departamento = cleanRow['Departamento'] || '';
            const ciudad = cleanRow['Ciudad'] || '';
            const codigoRubro = cleanRow['Codigo rubro'] || '';
            const rubro = cleanRow['Rubro'] || '';
            const cuentaPago = cleanRow['Cuenta Pago'] || '';
            const firma = cleanRow['Firma'] || '';
            const cargo = cleanRow['Cargo'] || '';

            if (!numero) {
              if (index < 100) errorMessages.push(`Fila ${index + 2}: Falta 'No.Pago'`);
              return;
            }

            // Attempt to find contract by exact match first
            let contractId = contractMap.get(numeroContratoOriginal) || firstContractId; 
            if (!contractMap.has(numeroContratoOriginal) && numeroContratoOriginal) {
               const matched = contracts.find(c => c.numero.includes(numeroContratoOriginal));
               if (matched) {
                 contractId = matched.id;
                 contractMap.set(numeroContratoOriginal, matched.id); 
               }
            }

            // Find matching RC with more flexibility
            let rcId = undefined;
            if (rc) {
              const matchedRC = state.financialDocuments.find((doc: any) => 
                doc.tipo === 'RC' && 
                (doc.numero.toLowerCase().trim() === rc.toLowerCase().trim() || 
                 doc.numero.toLowerCase().includes(rc.toLowerCase()) ||
                 doc.numeroCdp?.toLowerCase().trim() === cdp.toLowerCase().trim())
              );
              if (matchedRC) rcId = matchedRC.id;
            }

            const newPago: Pago = {
               id: `PAG-CSV-${Date.now()}-${index}`,
               contractId,
               rcId,
               numero,
               fecha,
               valor,
               estado: 'Pagado',
               observaciones,
               
               cdp,
               areaEjecutora,
               identificacion,
               beneficiario,
               banco,
               tipoCuenta,
               cuenta,
               solicitud,
               numeroContratoOriginal,
               rc,
               valorDistribuido,
               resolucion,
               fuente,
               fechaRadicado,
               departamento,
               ciudad,
               codigoRubro,
               rubro,
               cuentaPago,
               firma,
               cargo
            };

            pagosToUpload.push(newPago);
            successCount++;

          } catch (err: any) {
             errorMessages.push(`Fila ${index + 2}: Error al procesar - ${err.message}`);
          }
        });

        if (pagosToUpload.length > 0) {
          addPagos(pagosToUpload);
        }

        setIsProcessing(false);
        setResults({
          success: successCount,
          errors: errorMessages
        });
      },
      error: (error) => {
        setIsProcessing(false);
        setResults({
          success: 0,
          errors: [`Error parsing CSV: ${error.message}`]
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
        <h4 className="font-bold flex items-center gap-2 mb-2">
          <AlertCircle size={16} /> Estructura requerida (CSV)
        </h4>
        <p className="mb-2">El archivo debe contener las siguientes columnas (la primera fila debe ser el encabezado):</p>
        <code className="bg-white px-3 py-2 rounded border border-indigo-200 block text-xs overflow-x-auto whitespace-nowrap">
          "No.Pago","CDP","Area Ejecutora","Observación","Fecha","Identificación","Beneficiario","Valor",
          "Banco","Tipo Cuenta","Cuenta","Solicitud","Contrato","RC","Valor Distribuido","Resolucion",
          "Fuente","Fecha Radicado","Departamento","Ciudad","Codigo rubro","Rubro","Cuenta Pago","Firma","Cargo"
        </code>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        {!file ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <Upload size={32} />
            </div>
            <div>
              <p className="text-slate-700 font-medium whitespace-pre-wrap">Arrastra tu archivo CSV aquí o</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline"
              >
                selecciona un archivo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <FileText size={32} />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold">{file.name}</p>
              <p className="text-slate-500 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => setFile(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cambiar
              </button>
              <button 
                onClick={processCSV}
                className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : 'Procesar Archivo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className={`p-4 rounded-xl ${results.errors.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
            <h4 className="font-bold mb-2 flex items-center gap-2">
              {results.errors.length > 0 ? <AlertCircle size={18} className="text-amber-600" /> : <CheckCircle2 size={18} className="text-green-600" />}
              Resultados de la importación
            </h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>Pagos procesados correctamente: <span className="font-bold text-green-600">{results.success}</span></p>
              {results.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-bold text-amber-800">Errores encontrados ({results.errors.length}):</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-700 max-h-40 overflow-y-auto text-xs">
                    {results.errors.slice(0, 100).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {results.errors.length > 100 && <li>...y {results.errors.length - 100} errores más.</li>}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
               <button 
                 onClick={onComplete}
                 className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900"
               >
                 Aceptar y Cerrar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
