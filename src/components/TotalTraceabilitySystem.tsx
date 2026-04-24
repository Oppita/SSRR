import React, { useState, useMemo } from 'react';
import { Link2, ShieldCheck, AlertCircle, FileText, DollarSign, ArrowRight, CheckCircle2, Search, Filter, History, Database, Landmark, ClipboardCheck, GitMerge } from 'lucide-react';

interface TraceabilityNode {
  id: string;
  type: 'EVENT' | 'DAMAGE' | 'CONTRACT' | 'PAYMENT';
  label: string;
  status: 'VERIFIED' | 'PENDING' | 'FLAGGED';
  amount?: number;
  date: string;
  parentId?: string;
  metadata: Record<string, string>;
}

const MOCK_TRACEABILITY_DATA: TraceabilityNode[] = [
  { id: 'EVT-2024-082', type: 'EVENT', label: 'Inundación Cuenca Río Magdalena', status: 'VERIFIED', date: '2024-03-15', metadata: { 'Declaratoria': 'Decreto 045-2024', 'Intensidad': 'Alta' } },
  { id: 'DMG-082-001', type: 'DAMAGE', label: 'Puente Paso del Colegio - Estructura', parentId: 'EVT-2024-082', status: 'VERIFIED', amount: 85000, date: '2024-03-20', metadata: { 'ID_RUNAPE': 'A004', 'Validación': 'Técnica UNGRD' } },
  { id: 'CTR-DMG-455', type: 'CONTRACT', label: 'Consorcio Vial Huila - Reconstrucción', parentId: 'DMG-082-001', status: 'VERIFIED', amount: 82000, date: '2024-04-10', metadata: { 'SECOP_ID': 'CO1.PQR.123', 'Modalidad': 'Urgencia Manifiesta' } },
  { id: 'PAY-CTR-901', type: 'PAYMENT', label: 'Anticipo 20%', parentId: 'CTR-DMG-455', status: 'VERIFIED', amount: 16400, date: '2024-04-25', metadata: { 'SIIF_ID': 'PAY-8827', 'Banco': 'Banco Agrario' } },
  { id: 'PAY-CTR-902', type: 'PAYMENT', label: 'Acta de Obra #1', parentId: 'CTR-DMG-455', status: 'PENDING', amount: 25000, date: '2024-05-15', metadata: { 'SIIF_ID': 'PENDIENTE', 'Supervisor': 'Ing. Carlos Ruiz' } },
  
  { id: 'DMG-082-002', type: 'DAMAGE', label: 'Acueducto Pitalito - Bocatoma', parentId: 'EVT-2024-082', status: 'FLAGGED', amount: 12000, date: '2024-03-22', metadata: { 'ID_RUNAPE': 'A002', 'Alerta': 'Sobreestimación 35%' } },
];

export const TotalTraceabilitySystem: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = useMemo(() => {
    return MOCK_TRACEABILITY_DATA.filter(n => 
      (n.id || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (n.label || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );
  }, [searchQuery]);

  const selectedNode = useMemo(() => 
    MOCK_TRACEABILITY_DATA.find(n => n.id === selectedNodeId), 
  [selectedNodeId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'FLAGGED': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <GitMerge size={32} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Sistema de Trazabilidad Total (STT)</h2>
              <p className="text-sm text-indigo-300 font-bold uppercase tracking-widest">Control de Recursos y Cadena de Custodia Fiscal</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cumplimiento</p>
              <p className="text-lg font-black text-emerald-400">98.4%</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Alertas</p>
              <p className="text-lg font-black text-rose-400">02</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Chain of Custody Explorer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Link2 size={20} className="text-indigo-600" /> Explorador de Trazabilidad
              </h3>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar ID, Contrato, Pago..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredNodes.map((node) => (
                <div 
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedNodeId === node.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-50 hover:border-slate-200 bg-white'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    node.type === 'EVENT' ? 'bg-slate-900 text-white' :
                    node.type === 'DAMAGE' ? 'bg-rose-100 text-rose-600' :
                    node.type === 'CONTRACT' ? 'bg-blue-100 text-blue-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {node.type === 'EVENT' && <ClipboardCheck size={20} />}
                    {node.type === 'DAMAGE' && <AlertCircle size={20} />}
                    {node.type === 'CONTRACT' && <FileText size={20} />}
                    {node.type === 'PAYMENT' && <DollarSign size={20} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{node.id}</span>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(node.status)}`}>
                        {node.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 truncate">{node.label}</h4>
                  </div>

                  {node.amount && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Monto</p>
                      <p className="text-sm font-black text-slate-900">${node.amount.toLocaleString()}M</p>
                    </div>
                  )}
                  
                  <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={16} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Validations Panel */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-500" /> Validaciones Automáticas de Auditoría
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Control de Duplicidad de Daño', desc: 'Verifica que no existan dos contratos para el mismo ID de RUNAPE.', status: 'OK' },
                { label: 'Tope de Valor Contractual', desc: 'Contrato no puede exceder el 110% del daño estimado verificado.', status: 'OK' },
                { label: 'Validación de Nexo Causal', desc: 'Daño debe estar geocodificado dentro del área de influencia del evento.', status: 'OK' },
                { label: 'Cruce con SIIF Nación', desc: 'Verificación de disponibilidad presupuestal y registro de pago.', status: 'ERROR', alert: 'Desfase de $45M detectado' },
              ].map((v, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${v.status === 'OK' ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase">{v.label}</h4>
                    <span className={`text-[10px] font-bold ${v.status === 'OK' ? 'text-emerald-600' : 'text-rose-600'}`}>{v.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{v.desc}</p>
                  {v.alert && <p className="mt-2 text-[10px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle size={12} /> {v.alert}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Node Detail & Audit Trail */}
        <div className="space-y-6">
          {selectedNode ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedNode.type}</span>
                  <h3 className="text-xl font-black text-slate-900">{selectedNode.id}</h3>
                </div>
                <div className={`p-2 rounded-xl ${getStatusColor(selectedNode.status)}`}>
                  <ClipboardCheck size={20} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Información de Auditoría</p>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    {Object.entries(selectedNode.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{key.replace('_', ' ')}</span>
                        <span className="text-xs font-black text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-indigo-900 rounded-2xl text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Certificación de Trazabilidad</h4>
                  <p className="text-[11px] leading-relaxed opacity-80 italic">
                    Se certifica que este {(selectedNode.type || '').toLowerCase()} cumple con los estándares de trazabilidad exigidos por la Ley 1523 y los protocolos de auditoría de la Contraloría General.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-bold">Hash: 8f2a...c91e</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                  <History size={16} /> Ver Historial de Cambios
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-12 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <Database size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Selecciona un nodo para ver el detalle de trazabilidad</h3>
              <p className="text-sm text-slate-400 mt-2">Explora la cadena de custodia desde el evento hasta el pago final.</p>
            </div>
          )}

          <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
            <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Landmark size={14} /> Integración Financiera
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                <span>Sincronización SIIF</span>
                <span>ACTIVA</span>
              </div>
              <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[95%]"></div>
              </div>
              <p className="text-[10px] text-emerald-600 leading-tight italic">
                * Los pagos se bloquean automáticamente si no existe un nexo causal verificado en el STT.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
