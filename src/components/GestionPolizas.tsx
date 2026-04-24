import React, { useState, useMemo } from 'react';
import { ShieldCheck, Plus, Search, Filter, Calendar, FileText, AlertCircle, CheckCircle2, Clock, XCircle, Trash2, Edit2, ExternalLink, ArrowRight, TrendingUp, DollarSign, Percent, Loader2, Upload, BrainCircuit, AlertTriangle, FileWarning, Link2, User, Scale, Shield, Zap, X, Bell, LayoutGrid, Map as MapIcon, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProject } from '../store/ProjectContext';
import { Poliza, Contract, Task } from '../types';
import { analyzePolicyDocument, analyzePolicyText } from '../services/geminiService';
import { PolicyTimeline } from './PolicyTimeline';
import { HeatMapPolizas } from './HeatMapPolizas';
import { showAlert } from '../utils/alert';
import { AIProviderSelector } from './AIProviderSelector';
import { getAIModel } from '../services/aiProviderService';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
};

interface GestionPolizasProps {
  projectId?: string;
}

export const GestionPolizas: React.FC<GestionPolizasProps> = ({ projectId }) => {
  const { state, addPoliza, updatePoliza, deletePoliza, addTask } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingPoliza, setEditingPoliza] = useState<Poliza | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterAseguradora, setFilterAseguradora] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline' | 'reports' | 'map'>('cards');
  const [pastedText, setPastedText] = useState('');
  const [isPastingText, setIsPastingText] = useState(false);
  const [isAssigningTasks, setIsAssigningTasks] = useState(false);
  const [polizaToDelete, setPolizaToDelete] = useState<string | null>(null);

  const [riskQuery, setRiskQuery] = useState('');
  const [showRiskResults, setShowRiskResults] = useState(false);

  const handleAssignRenewalTasks = async () => {
    setIsAssigningTasks(true);
    
    const expiringSoon = policyMetrics.proximasAVencer;
    
    if (expiringSoon.length === 0) {
      showAlert('No hay pólizas próximas a vencer en los próximos 30 días.');
      setIsAssigningTasks(false);
      return;
    }

    expiringSoon.forEach(poliza => {
      const contrato = state.contratos.find(c => c.id === poliza.id_contrato);
      const proyecto = state.proyectos.find(p => p.id === poliza.id_proyecto);
      
      const newTask: Task = {
        id: `TASK-REN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId: poliza.id_proyecto || '',
        title: `Renovación de Póliza ${poliza.numero_poliza}`,
        description: `La póliza ${poliza.numero_poliza} del contrato ${poliza.numero_contrato} vence el ${poliza.fecha_finalizacion_vigencia}. Se requiere gestionar la renovación o el anexo correspondiente.`,
        status: 'Pendiente',
        priority: 'Alta',
        dueDate: poliza.fecha_finalizacion_vigencia,
        assignedTo: proyecto?.apoyoJuridicoId || 'Coordinación Jurídica'
      };
      
      addTask(newTask);
    });

    showAlert(`${expiringSoon.length} tareas de renovación asignadas automáticamente a los responsables.`);
    setIsAssigningTasks(false);
  };

  const [newPoliza, setNewPoliza] = useState<Partial<Poliza>>({
    tipo_amparo: '',
    numero_poliza: '',
    valor_asegurado: 0,
    numero_certificado_anexo: '',
    entidad_aseguradora: '',
    tipo_garantia: '',
    fecha_expedicion: new Date().toISOString().split('T')[0],
    fecha_aprobacion: new Date().toISOString().split('T')[0],
    fecha_inicio_vigencia: new Date().toISOString().split('T')[0],
    fecha_finalizacion_vigencia: new Date().toISOString().split('T')[0],
    estado: 'Vigente',
    apoyo_supervision: '',
    riesgo_cubierto: '',
    impacto_financiero_potencial: '',
    relacion_con_otrosi: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const contrato = state.contratos.find(c => c.id === newPoliza.id_contrato);
      const proyecto = state.proyectos.find(p => p.id === (projectId || contrato?.projectId));
      
      const contractContext = contrato ? {
        numero_proyecto: proyecto?.id || '',
        valor_contrato: contrato.valor || 0,
        fecha_inicio: contrato.fechaInicio || '',
        fecha_fin: contrato.fechaFin || ''
      } : undefined;

      const extractedData = await analyzePolicyDocument(file, getAIModel(), contractContext);
      
      setNewPoliza(prev => ({
        ...prev,
        ...extractedData,
        // Ensure numeric value
        valor_asegurado: typeof extractedData.valor_asegurado === 'string' 
          ? parseFloat(extractedData.valor_asegurado.replace(/[^0-9.]/g, '')) 
          : extractedData.valor_asegurado
      }));
      
      showAlert('Datos extraídos y validados correctamente de la póliza.');
    } catch (error) {
      console.error('Error analyzing policy:', error);
      showAlert('No se pudo analizar el documento. Intente de nuevo o use otro modelo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextExtraction = async () => {
    if (!pastedText.trim()) return;

    setIsAnalyzing(true);
    try {
      const contrato = state.contratos.find(c => c.id === newPoliza.id_contrato);
      const proyecto = state.proyectos.find(p => p.id === (projectId || contrato?.projectId));
      
      const contractContext = contrato ? {
        numero_proyecto: proyecto?.id || '',
        valor_contrato: contrato.valor || 0,
        fecha_inicio: contrato.fechaInicio || '',
        fecha_fin: contrato.fechaFin || ''
      } : undefined;

      const extractedData = await analyzePolicyText(pastedText, getAIModel(), contractContext);
      
      setNewPoliza(prev => ({
        ...prev,
        ...extractedData,
        valor_asegurado: typeof extractedData.valor_asegurado === 'string' 
          ? parseFloat(extractedData.valor_asegurado.replace(/[^0-9.]/g, '')) 
          : extractedData.valor_asegurado
      }));
      
      showAlert('Datos extraídos y validados correctamente del texto.');
      setIsPastingText(false);
      setPastedText('');
    } catch (error) {
      console.error('Error analyzing policy text:', error);
      showAlert('No se pudo analizar el texto. Intente de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredPolizas = useMemo(() => {
    let polizas = state.polizas || [];
    if (projectId) {
      polizas = polizas.filter(p => p.id_proyecto === projectId);
    }

    return polizas.filter(p => {
      const searchLower = (searchTerm || '').toLowerCase();
      const matchesSearch = 
        (p.numero_poliza?.toString() || '').toLowerCase().includes(searchLower) ||
        (p.entidad_aseguradora || '').toLowerCase().includes(searchLower) ||
        (p.numero_contrato?.toString() || '').toLowerCase().includes(searchLower);
      
      const matchesEstado = filterEstado === 'all' || p.estado === filterEstado;
      const matchesAseguradora = filterAseguradora === 'all' || p.entidad_aseguradora === filterAseguradora;
      
      return matchesSearch && matchesEstado && matchesAseguradora;
    });
  }, [state.polizas, projectId, searchTerm, filterEstado, filterAseguradora]);

  const uniqueAseguradoras = useMemo(() => {
    const setValue = new Set(state.polizas.map(p => p.entidad_aseguradora).filter(Boolean));
    return Array.from(setValue).sort();
  }, [state.polizas]);

  const getCoverageLevel = (pct: number) => {
    if (pct >= 100) return { label: 'Adecuado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> };
    if (pct >= 50) return { label: 'Parcial', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle size={14} /> };
    return { label: 'Insuficiente', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <AlertTriangle size={14} /> };
  };

  const contractsWithoutPolicy = useMemo(() => {
    const contracts = state.contratos.filter(c => !projectId || c.projectId === projectId);
    return contracts.filter(c => !state.polizas.some(p => p.id_contrato === c.id));
  }, [state.contratos, state.polizas, projectId]);

  const expiredPoliciesCount = useMemo(() => {
    return filteredPolizas.filter(p => p.estado === 'Vencida' || new Date(p.fecha_finalizacion_vigencia) < new Date()).length;
  }, [filteredPolizas]);

  const policyMetrics = useMemo(() => {
    const polizas = filteredPolizas;
    const totalAsegurado = polizas.reduce((sum, p) => sum + (p.valor_asegurado || 0), 0);
    const totalNoAsegurado = polizas.reduce((sum, p) => sum + (p.riesgo_descubierto || 0), 0);
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const proximasAVencer = polizas.filter(p => {
      const fechaFin = new Date(p.fecha_finalizacion_vigencia);
      return p.estado === 'Vigente' && fechaFin > today && fechaFin <= thirtyDaysFromNow;
    });

    const contracts = state.contratos.filter(c => !projectId || c.projectId === projectId);
    const contractsWithoutActivePolicy = contracts.filter(c => {
      const contractPolicies = state.polizas.filter(p => p.id_contrato === c.id);
      return !contractPolicies.some(p => p.estado === 'Vigente' && new Date(p.fecha_finalizacion_vigencia) > today);
    });

    const unapprovedPolicies = filteredPolizas.filter(p => !p.interventoria_valida);

    // PROMPT 521, 522: Cruza pólizas vs pagos ejecutados
    const pagos = state.pagos || [];
    const pagosSinCobertura = pagos.filter(pago => {
      const contract = state.contratos.find(c => c.id === pago.contractId);
      if (projectId && contract?.projectId !== projectId) return false;
      
      const contractPolicies = state.polizas.filter(p => p.id_contrato === pago.contractId);
      const fechaPago = new Date(pago.fecha);
      // Un pago no tiene cobertura si su fecha no cae dentro de ninguna póliza vigente para ese contrato
      return !contractPolicies.some(pol => {
        const inicio = new Date(pol.fecha_inicio_vigencia);
        const fin = new Date(pol.fecha_finalizacion_vigencia);
        return fechaPago >= inicio && fechaPago <= fin;
      });
    });

    // PROMPT 528, 529: Cruza pólizas vs otrosíes
    const otrosies = state.otrosies || [];
    const otrosiesSinActualizacion = otrosies.filter(o => {
      const contract = state.contratos.find(c => c.id === o.contractId);
      if (projectId && contract?.projectId !== projectId) return false;
      
      // Otrosíes que aumentan valor o tiempo requieren actualización de póliza
      if ((o.valorAdicional || 0) === 0 && (o.plazoAdicionalMeses || 0) === 0) return false;
      
      const contractPolicies = state.polizas.filter(p => p.id_contrato === o.contractId);
      const fechaOtrosie = new Date(o.fechaFirma);
      // Buscamos si hay una póliza (anexo) firmada después del otrosí
      return !contractPolicies.some(pol => new Date(pol.fecha_expedicion) >= fechaOtrosie);
    });

    // Detectar avance sin cobertura (gravísimo)
    const projects = state.proyectos.filter(p => !projectId || p.id === projectId);
    const avanceSinCobertura = projects.some(p => {
      const projectPolicies = state.polizas.filter(pol => pol.id_proyecto === p.id);
      const hasActivePolicy = projectPolicies.some(pol => pol.estado === 'Vigente' && new Date(pol.fecha_finalizacion_vigencia) > today);
      return (p.avanceFisico || 0) > 0 && !hasActivePolicy;
    });

    // PROMPT 536, 537, 538: Reportes por contratista
    const contractorStats = state.contratos.reduce((acc, c) => {
      if (projectId && c.projectId !== projectId) return acc;
      const name = c.contratista;
      if (!acc[name]) {
        acc[name] = { 
          name, 
          totalContracts: 0, 
          contractsWithPolicy: 0, 
          expiredPolicies: 0, 
          unapprovedPolicies: 0,
          complianceScore: 0
        };
      }
      acc[name].totalContracts++;
      const contractPolicies = state.polizas.filter(p => p.id_contrato === c.id);
      if (contractPolicies.length > 0) acc[name].contractsWithPolicy++;
      acc[name].expiredPolicies += contractPolicies.filter(p => p.estado === 'Vencida').length;
      acc[name].unapprovedPolicies += contractPolicies.filter(p => !p.interventoria_valida).length;
      
      // Calculate compliance score (0-100)
      const policyRatio = acc[name].contractsWithPolicy / acc[name].totalContracts;
      const approvalRatio = contractPolicies.length > 0 ? (contractPolicies.filter(p => p.interventoria_valida).length / contractPolicies.length) : 1;
      acc[name].complianceScore = (policyRatio * 0.7 + approvalRatio * 0.3) * 100;
      
      return acc;
    }, {} as Record<string, any>);

    const contractorRanking = Object.values(contractorStats).sort((a: any, b: any) => b.complianceScore - a.complianceScore);

    return {
      totalAsegurado,
      totalNoAsegurado,
      proximasAVencer,
      contractsWithoutActivePolicy,
      unapprovedPolicies,
      pagosSinCobertura,
      otrosiesSinActualizacion,
      avanceSinCobertura,
      contractorRanking
    };
  }, [filteredPolizas, state.contratos, state.polizas, state.proyectos, state.pagos, state.otrosies, projectId]);

  const handleSave = () => {
    if (!newPoliza.id_contrato || !newPoliza.numero_poliza) return;

    const contrato = state.contratos.find(c => c.id === newPoliza.id_contrato);
    if (!contrato) return;

    const valorContrato = contrato.valor || 0;
    const valorAsegurado = newPoliza.valor_asegurado || 0;
    const porcentaje = valorContrato > 0 ? (valorAsegurado / valorContrato) * 100 : 0;
    const riesgoDescubierto = Math.max(0, valorContrato - valorAsegurado);

    // Determine estado de cobertura
    let estadoCobertura: Poliza['estado_cobertura'] = 'Adecuado';
    if (porcentaje < 10) {
      estadoCobertura = 'Insuficiente';
    } else if (porcentaje < 50) {
      estadoCobertura = 'Parcial';
    }

    const polizaData: Poliza = {
      ...(newPoliza as Poliza),
      id: editingPoliza?.id || `POL-${Date.now()}`,
      id_proyecto: projectId || contrato.projectId,
      numero_proyecto: state.proyectos.find(p => p.id === (projectId || contrato.projectId))?.id,
      tipo_contrato: contrato.tipo,
      numero_contrato: contrato.numero,
      porcentaje_cobertura: porcentaje,
      riesgo_descubierto: riesgoDescubierto,
      estado_cobertura: estadoCobertura,
      historial_modificaciones: editingPoliza?.historial_modificaciones || [],
      interventoria_valida: true // AUTO-APPROVE as per request
    };

    if (editingPoliza) {
      updatePoliza(polizaData);
    } else {
      addPoliza(polizaData);
    }

    setShowNewModal(false);
    setEditingPoliza(null);
    setNewPoliza({
      tipo_amparo: '',
      numero_poliza: '',
      valor_asegurado: 0,
      numero_certificado_anexo: '',
      entidad_aseguradora: '',
      tipo_garantia: '',
      fecha_expedicion: new Date().toISOString().split('T')[0],
      fecha_aprobacion: new Date().toISOString().split('T')[0],
      fecha_inicio_vigencia: new Date().toISOString().split('T')[0],
      fecha_finalizacion_vigencia: new Date().toISOString().split('T')[0],
      estado: 'Vigente',
      apoyo_supervision: '',
      riesgo_cubierto: '',
      impacto_financiero_potencial: '',
      relacion_con_otrosi: ''
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Vigente': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Vencida': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'En Trámite': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Anulada': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCoberturaColor = (estado: string) => {
    switch (estado) {
      case 'Vigente': return 'text-emerald-600';
      case 'Vencida': return 'text-rose-600';
      case 'Insuficiente': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={28} />
            Gestión de Pólizas y Garantías
          </h2>
          <p className="text-slate-500 mt-1">Control de amparos, coberturas y riesgos financieros.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="¿Qué proyectos están en riesgo?"
              value={riskQuery}
              onChange={(e) => setRiskQuery(e.target.value)}
              onFocus={() => setShowRiskResults(true)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 w-64 text-sm"
            />
            {showRiskResults && riskQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proyectos con Riesgo de Cobertura</h4>
                  <button onClick={() => setShowRiskResults(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {state.proyectos
                    .filter(p => {
                      const pPolicies = state.polizas.filter(pol => pol.id_proyecto === p.id);
                      const pContracts = state.contratos.filter(c => c.projectId === p.id);
                      const totalAsegurado = pPolicies.reduce((sum, pol) => sum + (pol.valor_asegurado || 0), 0);
                      const totalContratado = pContracts.reduce((sum, c) => sum + (c.valor || 0), 0);
                      return totalContratado > totalAsegurado || pPolicies.some(pol => pol.estado === 'Vencida');
                    })
                    .filter(p => (p.nombre || '').toLowerCase().includes((riskQuery || '').toLowerCase()))
                    .map(p => (
                      <div key={p.id} className="p-3 rounded-lg border border-rose-100 bg-rose-50/30 hover:bg-rose-50 transition-colors cursor-pointer">
                        <div className="text-sm font-bold text-slate-900">{p.nombre}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold uppercase">Riesgo Detectado</span>
                          <span className="text-[10px] text-slate-500">{p.id}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAssignRenewalTasks}
            disabled={isAssigningTasks}
            className="flex items-center gap-2 bg-white text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isAssigningTasks ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
            Asignar Renovaciones
          </button>

          <div className="relative group">
            <button
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              Nueva Póliza
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <button
                onClick={() => {
                  setNewPoliza({
                    ...newPoliza,
                    fecha_expedicion: new Date().toISOString().split('T')[0],
                    fecha_aprobacion: new Date().toISOString().split('T')[0],
                    fecha_inicio_vigencia: new Date().toISOString().split('T')[0],
                    fecha_finalizacion_vigencia: new Date().toISOString().split('T')[0],
                    estado: 'Vigente'
                  });
                  setShowNewModal(true);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100"
              >
                <Plus size={16} className="text-indigo-500" />
                Creación Manual
              </button>
              <button
                onClick={() => {
                  setShowNewModal(true);
                  setIsPastingText(true);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100"
              >
                <FileText size={16} className="text-indigo-500" />
                Extraer de Texto (IA)
              </button>
              <label className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer">
                <Upload size={16} className="text-indigo-500" />
                Subir Escaneada (IA)
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ShieldCheck size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Asegurado</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(policyMetrics.totalAsegurado)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Riesgo No Asegurado</span>
          </div>
          <p className="text-xl font-bold text-rose-600">{formatCurrency(policyMetrics.totalNoAsegurado)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Próximas a Vencer</span>
          </div>
          <p className="text-xl font-bold text-amber-600">{policyMetrics.proximasAVencer.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">En los próximos 30 días</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <XCircle size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Sin Cobertura</span>
          </div>
          <p className="text-xl font-bold text-rose-600">{policyMetrics.contractsWithoutActivePolicy.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Contratos sin garantía activa</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Cobertura Promedio</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">
            {(filteredPolizas.reduce((acc, p) => acc + p.porcentaje_cobertura, 0) / (filteredPolizas.length || 1)).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="space-y-3">
        {policyMetrics.avanceSinCobertura && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900 uppercase tracking-tight">ALERTA CRÍTICA: Avance sin Cobertura Vigente</h4>
              <p className="text-xs text-rose-700 mt-1">
                Se ha detectado avance físico en el proyecto pero no existe ninguna póliza vigente que respalde la ejecución actual. 
                <span className="font-bold ml-1">Acción requerida inmediata.</span>
              </p>
            </div>
          </div>
        )}

        {policyMetrics.contractsWithoutActivePolicy.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">⚠️ Contrato sin cobertura activa</h4>
              <p className="text-xs text-amber-700 mt-1">
                Los siguientes contratos no tienen una póliza vigente: 
                <span className="font-bold ml-1">
                  {policyMetrics.contractsWithoutActivePolicy.map(c => c.numero).join(', ')}
                </span>
              </p>
            </div>
          </div>
        )}

        {policyMetrics.totalNoAsegurado > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <DollarSign className="text-orange-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-orange-900">⚠️ Riesgo financiero no asegurado</h4>
              <p className="text-xs text-orange-700 mt-1">
                Existe un valor total de <span className="font-bold">{formatCurrency(policyMetrics.totalNoAsegurado)}</span> que no cuenta con respaldo de garantías.
              </p>
            </div>
          </div>
        )}

        {policyMetrics.unapprovedPolicies.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">⚠️ Pólizas pendientes de aprobación</h4>
              <p className="text-xs text-amber-700 mt-1">
                Existen <span className="font-bold">{policyMetrics.unapprovedPolicies.length} pólizas</span> que han sido cargadas pero aún no cuentan con la validación de interventoría.
              </p>
            </div>
          </div>
        )}

        {policyMetrics.pagosSinCobertura.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900 uppercase tracking-tight">⚠️ Pagos sin respaldo de póliza</h4>
              <p className="text-xs text-rose-700 mt-1">
                Se han detectado <span className="font-bold">{policyMetrics.pagosSinCobertura.length} pagos</span> realizados en fechas donde no existía una póliza vigente para el contrato.
              </p>
            </div>
          </div>
        )}

        {policyMetrics.otrosiesSinActualizacion.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 uppercase tracking-tight">⚠️ Otrosí sin respaldo asegurador</h4>
              <p className="text-xs text-amber-700 mt-1">
                Existen <span className="font-bold">{policyMetrics.otrosiesSinActualizacion.length} otrosíes</span> (adiciones en valor o tiempo) que no cuentan con la actualización correspondiente de la póliza (anexo).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Toggle and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Tarjetas
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Tablas
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'timeline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Línea de Tiempo
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Estrategia Territorial
          </button>
          <button
            onClick={() => setViewMode('reports')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Reportes
          </button>
        </div>

        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por póliza o contrato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={filterAseguradora}
            onChange={(e) => setFilterAseguradora(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
          >
            <option value="all">Todas las Aseguradoras</option>
            {uniqueAseguradoras.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="Vigente">Vigente</option>
            <option value="Vencida">Vencida</option>
            <option value="En Trámite">En Trámite</option>
          </select>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {filteredPolizas.map((poliza) => {
             const level = getCoverageLevel(poliza.porcentaje_cobertura);
             return (
               <motion.div 
                 key={poliza.id}
                 whileHover={{ y: -5 }}
                 className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all p-8 flex flex-col relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform">
                   <Shield size={120} />
                 </div>
                 
                 <div className="flex justify-between items-start mb-6 relative">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{poliza.numero_poliza}</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 truncate max-w-[150px]">{poliza.entidad_aseguradora}</p>
                     </div>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 ${getEstadoColor(poliza.estado)}`}>
                     {poliza.estado}
                   </div>
                 </div>

                 <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span>Contrato</span>
                       <span className="text-indigo-600">{poliza.numero_contrato}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-snug">{poliza.tipo_amparo}</p>
                    <div className="flex items-center gap-2 mt-2">
                       {poliza.relacion_con_otrosi && (
                         <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 uppercase tracking-tighter">Vínculo Otrosí</span>
                       )}
                       {poliza.interventoria_valida ? (
                         <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 uppercase tracking-tighter">Validado</span>
                       ) : (
                         <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 uppercase tracking-tighter">Pendiente</span>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Valor Asegurado</span>
                       <span className="text-sm font-black text-slate-900">{formatCurrency(poliza.valor_asegurado)}</span>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fin Vigencia</span>
                       <span className="text-sm font-black text-slate-900">{new Date(poliza.fecha_finalizacion_vigencia).toLocaleDateString()}</span>
                    </div>
                 </div>

                 <div className="space-y-3 mt-auto">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Cobertura</span>
                       <span className={`text-[11px] font-bold ${level.color.split(' ')[1]}`}>{poliza.porcentaje_cobertura.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, poliza.porcentaje_cobertura)}%` }}
                         className={`h-full ${
                            poliza.porcentaje_cobertura >= 100 ? 'bg-emerald-500' : 
                            poliza.porcentaje_cobertura >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                         }`}
                       />
                    </div>
                 </div>

                 <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-slate-100">
                    {!poliza.interventoria_valida && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updatedPoliza = {
                            ...poliza,
                            interventoria_valida: true,
                            aprobada_por: 'Interventoría Central',
                            fecha_aprobacion_interventoria: new Date().toISOString()
                          };
                          updatePoliza(updatedPoliza);
                          showAlert('Póliza aprobada por interventoría.');
                        }}
                        className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                        title="Aprobar Póliza"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPoliza(poliza);
                        setNewPoliza(poliza);
                        setShowNewModal(true);
                      }}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPolizaToDelete(poliza.id);
                      }}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               </motion.div>
             );
           })}
           {filteredPolizas.length === 0 && (
             <div className="col-span-full py-20 text-center">
               <Shield size={64} className="mx-auto text-slate-200 mb-4" />
               <h3 className="text-xl font-bold text-slate-700">Sin Pólizas</h3>
               <p className="text-slate-400 mt-2">Acomode los filtros o agregue una nueva póliza.</p>
             </div>
           )}
        </div>
      ) : viewMode === 'table' ? (
        /* Policies Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Póliza / Aseguradora</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contrato</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amparo / Garantía</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vigencia</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cobertura</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Apoyo / Supervisión</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPolizas.map((poliza) => (
                <tr key={poliza.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{poliza.numero_poliza}</span>
                        {poliza.relacion_con_otrosi && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                            <Link2 size={8} />
                            Otrosí
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{poliza.entidad_aseguradora}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-700">{poliza.numero_contrato}</div>
                    <div className="text-xs text-slate-500">{poliza.tipo_contrato}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700 font-medium">{poliza.tipo_amparo}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{poliza.tipo_garantia}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Calendar size={12} className="text-slate-400" />
                        <span>Fin: {new Date(poliza.fecha_finalizacion_vigencia).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Inicio: {new Date(poliza.fecha_inicio_vigencia).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-bold text-slate-900">{formatCurrency(poliza.valor_asegurado)}</div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              poliza.porcentaje_cobertura >= 100 ? 'bg-emerald-500' : 
                              poliza.porcentaje_cobertura >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, poliza.porcentaje_cobertura)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{poliza.porcentaje_cobertura.toFixed(1)}%</span>
                      </div>
                      {(() => {
                        const level = getCoverageLevel(poliza.porcentaje_cobertura);
                        return (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 w-fit ${level.color}`}>
                            {level.icon}
                            {level.label}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{poliza.apoyo_supervision || 'No asignado'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border w-fit ${getEstadoColor(poliza.estado)}`}>
                        {poliza.estado}
                      </span>
                      {poliza.interventoria_valida ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 w-fit">
                          <CheckCircle2 size={10} />
                          Aprobada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 w-fit">
                          <Clock size={10} />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {!poliza.interventoria_valida && (
                        <button
                          onClick={() => {
                            const updatedPoliza = {
                              ...poliza,
                              interventoria_valida: true,
                              aprobada_por: 'Interventoría Central',
                              fecha_aprobacion_interventoria: new Date().toISOString()
                            };
                            updatePoliza(updatedPoliza);
                            showAlert('Póliza aprobada por interventoría.');
                          }}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Aprobar Póliza"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingPoliza(poliza);
                          setNewPoliza(poliza);
                          setShowNewModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setPolizaToDelete(poliza.id);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPolizas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldCheck size={48} className="opacity-20" />
                      <p>No se encontraron pólizas registradas.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : viewMode === 'timeline' ? (
        <PolicyTimeline polizas={filteredPolizas} contratos={state.contratos} />
      ) : viewMode === 'map' ? (
        <div className="animate-in fade-in zoom-in duration-500">
           <HeatMapPolizas polizas={state.polizas} contracts={state.contratos} projects={state.proyectos} />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* PROMPT 535: Estado de pólizas por proyecto */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={20} />
                Estado de Pólizas por Proyecto
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.proyectos.filter(p => !projectId || p.id === projectId).map(project => {
                  const projectPolicies = state.polizas.filter(pol => pol.id_proyecto === project.id);
                  const activePolicies = projectPolicies.filter(pol => pol.estado === 'Vigente');
                  const expiredPolicies = projectPolicies.filter(pol => pol.estado === 'Vencida');
                  const pendingApproval = projectPolicies.filter(pol => !pol.interventoria_valida);
                  
                  return (
                    <div key={project.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:shadow-md transition-all">
                      <h4 className="font-bold text-slate-900 mb-3 truncate">{project.nombre}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Total Pólizas:</span>
                          <span className="font-bold text-slate-900">{projectPolicies.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Vigentes:</span>
                          <span className="font-bold text-emerald-600">{activePolicies.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Vencidas:</span>
                          <span className="font-bold text-rose-600">{expiredPolicies.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Pendientes Aprobación:</span>
                          <span className="font-bold text-amber-600">{pendingApproval.length}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          <span>Cobertura Global</span>
                          <span>{projectPolicies.length > 0 ? ((activePolicies.length / projectPolicies.length) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${projectPolicies.length > 0 ? (activePolicies.length / projectPolicies.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PROMPT 536, 537, 538: Ranking de Contratistas por Cumplimiento */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} />
                Ranking de Contratistas por Cumplimiento de Pólizas
              </h3>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contratista</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Contratos</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Con Póliza</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Vencidas</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Sin Aprobar</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cumplimiento</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {policyMetrics.contractorRanking.map((contractor: any, index: number) => (
                    <tr key={contractor.name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {index + 1}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{contractor.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center text-sm text-slate-600">{contractor.totalContracts}</td>
                      <td className="p-4 text-center text-sm text-slate-600">{contractor.contractsWithPolicy}</td>
                      <td className="p-4 text-center text-sm text-rose-600 font-medium">{contractor.expiredPolicies}</td>
                      <td className="p-4 text-center text-sm text-amber-600 font-medium">{contractor.unapprovedPolicies}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                            <div 
                              className={`h-full ${
                                contractor.complianceScore >= 90 ? 'bg-emerald-500' : 
                                contractor.complianceScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${contractor.complianceScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{contractor.complianceScore.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {contractor.complianceScore < 70 || contractor.expiredPolicies > 0 ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1 w-fit ml-auto">
                            <FileWarning size={10} />
                            Riesgo Alto
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 w-fit ml-auto">
                            <CheckCircle2 size={10} />
                            Confiable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PROMPT 539, 540: Modelo de Riesgo Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BrainCircuit className="text-indigo-600" size={20} />
                Modelo de Riesgo Financiero
              </h3>
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Riesgo Financiero del Proyecto</div>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(policyMetrics.totalNoAsegurado)}</div>
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    * Calculado basado en el valor de contratos sin cobertura activa o con pólizas vencidas.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Nivel de Riesgo:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      policyMetrics.totalNoAsegurado > 1000000000 ? 'bg-rose-100 text-rose-700' : 
                      policyMetrics.totalNoAsegurado > 100000000 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {policyMetrics.totalNoAsegurado > 1000000000 ? 'CRÍTICO' : 
                       policyMetrics.totalNoAsegurado > 100000000 ? 'MODERADO' : 'BAJO'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Pólizas Vencidas:</span>
                    <span className="text-sm font-bold text-rose-600">{expiredPoliciesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Contratos sin Respaldo:</span>
                    <span className="text-sm font-bold text-amber-600">{policyMetrics.contractsWithoutActivePolicy.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PROMPT 541, 542, 543: Semáforo de Cumplimiento Legal (Ley 1523) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Scale className="text-indigo-600" size={20} />
                Semáforo de Cumplimiento Legal (Ley 1523)
              </h3>
              <div className="space-y-4">
                {filteredPolizas.length > 0 ? (
                  filteredPolizas.map(pol => {
                    const cumple = pol.validacion_ia?.cumplimiento_ley_1523?.cumple;
                    return (
                      <div key={pol.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${cumple ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                          <div>
                            <div className="text-sm font-bold text-slate-900">{pol.numero_poliza}</div>
                            <div className="text-[10px] text-slate-500">{pol.tipo_amparo}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-bold ${cumple ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {cumple ? 'CUMPLIMIENTO TOTAL' : 'INCONSISTENCIA LEGAL'}
                          </div>
                          <div className="text-[10px] text-slate-400">Validación Normativa IA</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 italic text-sm">
                    No hay pólizas para validar cumplimiento.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PROMPT 550: Vista 360 - Cobertura y Riesgo */}
          <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <ShieldCheck size={200} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-indigo-400" size={32} />
                <div>
                  <h3 className="text-xl font-bold">VISTA 360: Cobertura y Riesgo Asegurador</h3>
                  <p className="text-indigo-300 text-sm">Análisis integral de protección financiera del proyecto</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="text-xs font-bold text-indigo-300 uppercase mb-2">Valor Total Asegurado</div>
                  <div className="text-2xl font-black text-white">{formatCurrency(policyMetrics.totalAsegurado)}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400" style={{ width: `${(policyMetrics.totalAsegurado / (policyMetrics.totalAsegurado + policyMetrics.totalNoAsegurado || 1)) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold">
                      {((policyMetrics.totalAsegurado / (policyMetrics.totalAsegurado + policyMetrics.totalNoAsegurado || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="text-xs font-bold text-rose-300 uppercase mb-2">Riesgo Financiero Expuesto</div>
                  <div className="text-2xl font-black text-rose-400">{formatCurrency(policyMetrics.totalNoAsegurado)}</div>
                  <div className="mt-2 text-[10px] text-rose-200">
                    {policyMetrics.totalNoAsegurado > 0 ? '⚠️ Requiere gestión de amparos adicionales' : '✅ Riesgo dentro de límites aceptables'}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                  <div className="text-xs font-bold text-emerald-300 uppercase mb-2">Cumplimiento Normativo</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {filteredPolizas.length > 0 ? (filteredPolizas.filter(p => p.validacion_ia?.cumplimiento_ley_1523?.cumple).length / filteredPolizas.length * 100).toFixed(0) : 0}%
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-200">
                    Basado en validación IA de Ley 1523
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={120} />
              </div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={20} />
                Alertas de Riesgo Crítico
              </h3>
              <div className="space-y-4 relative z-10">
                {policyMetrics.avanceSinCobertura && (
                  <div className="p-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                    <div className="text-xs font-bold text-rose-300 uppercase mb-1">🔥 GRAVÍSIMO</div>
                    <div className="text-sm font-medium">Se detectó avance físico de obra en proyectos sin cobertura de póliza vigente.</div>
                  </div>
                )}
                {policyMetrics.pagosSinCobertura.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                    <div className="text-xs font-bold text-amber-300 uppercase mb-1">⚠️ RIESGO FINANCIERO</div>
                    <div className="text-sm font-medium">Existen {policyMetrics.pagosSinCobertura.length} pagos ejecutados sin respaldo de póliza en la fecha del pago.</div>
                  </div>
                )}
                {policyMetrics.unapprovedPolicies.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                    <div className="text-xs font-bold text-indigo-300 uppercase mb-1">ℹ️ INTERVENTORÍA</div>
                    <div className="text-sm font-medium">Hay {policyMetrics.unapprovedPolicies.length} pólizas pendientes de validación técnica por interventoría.</div>
                  </div>
                )}
                {policyMetrics.contractsWithoutActivePolicy.length === 0 && !policyMetrics.avanceSinCobertura && (
                  <div className="p-4 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={32} />
                    <p className="text-sm font-medium">No se detectan riesgos críticos de cobertura en este momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
      )}

      {/* Modal Eliminar Póliza */}
      {polizaToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-white" />
                <h3 className="text-xl font-bold">Eliminar Póliza</h3>
              </div>
              <button onClick={() => setPolizaToDelete(null)} className="text-rose-200 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                ¿Está seguro de eliminar esta póliza? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPolizaToDelete(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deletePoliza(polizaToDelete);
                    setPolizaToDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New/Edit Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingPoliza ? <Edit2 size={24} /> : <Plus size={24} />}
                {editingPoliza ? 'Editar Póliza' : 'Nueva Póliza / Garantía'}
              </h3>
              <button onClick={() => {
                setShowNewModal(false);
                setIsPastingText(false);
              }} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* AI Extraction Section */}
              <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                      <BrainCircuit size={20} />
                      Extracción Inteligente de Póliza
                    </h4>
                    <p className="text-sm text-indigo-700">Sube el PDF o pega el texto para extraer los datos automáticamente</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <AIProviderSelector />
                    <button
                      onClick={() => setIsPastingText(!isPastingText)}
                      className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <FileText size={18} />
                      {isPastingText ? 'Subir Archivo' : 'Pegar Texto'}
                    </button>
                  </div>
                </div>

                {isPastingText ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full h-48 p-4 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm bg-white"
                      placeholder="Pegue el contenido de la póliza aquí..."
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setIsPastingText(false)}
                        className="px-4 py-2 text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleTextExtraction}
                        disabled={isAnalyzing || !pastedText.trim()}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Analizando...
                          </>
                        ) : (
                          <>
                            <BrainCircuit size={20} />
                            Extraer con IA
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="policy-upload"
                      disabled={isAnalyzing}
                    />
                    <label
                      htmlFor="policy-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
                        ${isAnalyzing ? 'bg-indigo-100/50 border-indigo-300' : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50'}
                      `}
                    >
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="animate-spin text-indigo-600" size={32} />
                          <p className="text-sm font-bold text-indigo-700">Analizando documento con IA...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="text-indigo-500" size={32} />
                          <p className="text-sm font-bold text-indigo-700">Haga clic para subir o arrastre el archivo</p>
                          <p className="text-xs text-indigo-500">PDF, PNG o JPG (Máx. 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contract Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Contrato Vinculado *</label>
                  <select
                    value={newPoliza.id_contrato || ''}
                    onChange={(e) => {
                      const contrato = state.contratos.find(c => c.id === e.target.value);
                      setNewPoliza(prev => ({ 
                        ...prev, 
                        id_contrato: e.target.value,
                        numero_contrato: contrato?.numero || '',
                        tipo_contrato: contrato?.tipo || 'Obra',
                        relacion_con_otrosi: '' // Reset otrosi when contract changes
                      }));
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Seleccione un contrato...</option>
                    {state.contratos.filter(c => !projectId || c.projectId === projectId).map(c => (
                      <option key={c.id} value={c.id}>{c.numero} - {c.objetoContractual.substring(0, 50)}...</option>
                    ))}
                  </select>
                </div>

                {/* Otrosí Selection */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Link2 size={14} className="text-slate-400" />
                    Asociar a Otrosí
                  </label>
                  <select
                    value={newPoliza.relacion_con_otrosi || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, relacion_con_otrosi: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    disabled={!newPoliza.id_contrato}
                  >
                    <option value="">Ninguno (Contrato Principal)</option>
                    {state.otrosies
                      .filter(o => o.contractId === newPoliza.id_contrato)
                      .map(o => (
                        <option key={o.id} value={o.id}>Otrosí No. {o.numero}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Policy Details */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Número de Póliza *</label>
                  <input
                    type="text"
                    value={newPoliza.numero_poliza || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, numero_poliza: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Ej: POL-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Número de Certificado / Anexo</label>
                  <input
                    type="text"
                    value={newPoliza.numero_certificado_anexo || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, numero_certificado_anexo: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Ej: 001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Entidad Aseguradora *</label>
                  <select
                    value={newPoliza.entidad_aseguradora || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, entidad_aseguradora: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Seguros del Estado">Seguros del Estado</option>
                    <option value="La Previsora">La Previsora</option>
                    <option value="Sura">Seguros Sura</option>
                    <option value="Mapfre">Mapfre Seguros</option>
                    <option value="Axa Colpatria">Axa Colpatria</option>
                    <option value="Allianz">Allianz Seguros</option>
                    <option value="Liberty Seguros">Liberty Seguros</option>
                    <option value="Solidaria">Seguros Solidaria</option>
                    <option value="Seguros Mundial">Seguros Mundial</option>
                    <option value="SBS Seguros">SBS Seguros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Garantía *</label>
                  <select
                    value={newPoliza.tipo_garantia || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, tipo_garantia: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Póliza de Seguros">Póliza de Seguros</option>
                    <option value="Garantía Bancaria">Garantía Bancaria</option>
                    <option value="Fiducia Mercantil">Fiducia Mercantil</option>
                    <option value="Endoso en Garantía">Endoso en Garantía</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Amparo *</label>
                  <select
                    value={newPoliza.tipo_amparo || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, tipo_amparo: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Cumplimiento">Cumplimiento</option>
                    <option value="Pago de Salarios y Prestaciones Sociales">Laboral</option>
                    <option value="Estabilidad de la Obra">Estabilidad</option>
                    <option value="Calidad del Servicio">Calidad</option>
                    <option value="Responsabilidad Civil Extracontractual">RCE</option>
                    <option value="Seriedad de la Oferta">Seriedad Oferta</option>
                    <option value="Buen Manejo del Anticipo">Manejo de Anticipo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Valor Asegurado *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="number"
                      value={newPoliza.valor_asegurado || 0}
                      onChange={(e) => setNewPoliza(prev => ({ ...prev, valor_asegurado: Number(e.target.value) }))}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Expedición</label>
                  <input
                    type="date"
                    value={newPoliza.fecha_expedicion || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, fecha_expedicion: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Aprobación</label>
                  <input
                    type="date"
                    value={newPoliza.fecha_aprobacion || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, fecha_aprobacion: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
                  <select
                    value={newPoliza.estado || 'Vigente'}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, estado: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="Vencida">Vencida</option>
                    <option value="En Trámite">En Trámite</option>
                    <option value="Anulada">Anulada</option>
                  </select>
                </div>

                {/* AI Validation Results */}
                {newPoliza.validacion_ia && (
                  <div className="md:col-span-3 p-4 rounded-xl border bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-indigo-600" />
                        Resultado de Validación IA
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        newPoliza.validacion_ia.coherente 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {newPoliza.validacion_ia.coherente ? 'COHERENTE CON CONTRATO' : 'INCOHERENCIAS DETECTADAS'}
                      </span>
                    </div>
                    
                    {newPoliza.validacion_ia.observaciones && (
                      <div className="text-xs text-slate-600">
                        <span className="font-bold block mb-1">Observaciones:</span>
                        {newPoliza.validacion_ia.observaciones}
                      </div>
                    )}

                    {newPoliza.validacion_ia.inconsistencias && newPoliza.validacion_ia.inconsistencias.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-rose-700 block">Inconsistencias Legales/Técnicas:</span>
                        <ul className="list-disc list-inside text-[11px] text-rose-600 space-y-0.5">
                          {newPoliza.validacion_ia.inconsistencias.map((inc, i) => (
                            <li key={i}>{inc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Inicio Vigencia</label>
                  <input
                    type="date"
                    value={newPoliza.fecha_inicio_vigencia || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, fecha_inicio_vigencia: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fin Vigencia</label>
                  <input
                    type="date"
                    value={newPoliza.fecha_finalizacion_vigencia || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, fecha_finalizacion_vigencia: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo a la Supervisión</label>
                  <input
                    type="text"
                    value={newPoliza.apoyo_supervision || ''}
                    onChange={(e) => setNewPoliza(prev => ({ ...prev, apoyo_supervision: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Nombre del responsable"
                  />
                </div>

                {/* Intelligence Fields */}
                <div className="md:col-span-3 bg-indigo-50 p-4 rounded-xl space-y-4">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <BrainCircuit size={20} />
                    Análisis de Riesgo e Inteligencia
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Riesgo Cubierto</label>
                      <textarea
                        value={newPoliza.riesgo_cubierto || ''}
                        onChange={(e) => setNewPoliza(prev => ({ ...prev, riesgo_cubierto: e.target.value }))}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                        placeholder="Describa el riesgo específico que cubre este amparo..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Impacto Financiero Potencial</label>
                      <textarea
                        value={newPoliza.impacto_financiero_potencial || ''}
                        onChange={(e) => setNewPoliza(prev => ({ ...prev, impacto_financiero_potencial: e.target.value }))}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                        placeholder="Consecuencias económicas en caso de siniestro..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase">Relación con Otrosí (Referencia Adicional)</label>
                      <input
                        type="text"
                        value={newPoliza.relacion_con_otrosi || ''}
                        onChange={(e) => setNewPoliza(prev => ({ ...prev, relacion_con_otrosi: e.target.value }))}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                        placeholder="Referencia manual si aplica"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
              >
                {editingPoliza ? 'Guardar Cambios' : 'Registrar Póliza'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPolizas;
