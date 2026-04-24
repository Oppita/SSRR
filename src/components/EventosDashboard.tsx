import React, { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { EmergenciaEvento, Activity as ActivityType, SolicitudMaquinaria } from '../types';
import { AlertTriangle, MapPin, Calendar, Plus, Activity, Clock, Users, DollarSign, CloudRain, ShieldAlert, BarChart3, PieChart as PieChartIcon, X, Zap, Layers, Database, FileText, Map as MapIconLucide, Settings, Search, Trash2, Info, Landmark, Globe, CloudSnow, Waves, Calculator, Truck } from 'lucide-react';
import { formatDateForInput } from '../lib/storage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { EventColombiaMap } from './EventColombiaMap';
import { HeatMapPoint } from '../types';
import { ColombiaSelectionMap } from './ColombiaSelectionMap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ImpactMatrix } from './ImpactMatrix';
import { CuantificacionFisicaMethodology } from './CuantificacionFisicaMethodology';
import { ValoracionEconomicaMethodology } from './ValoracionEconomicaMethodology';
import { DanosVsNecesidadesMethodology } from './DanosVsNecesidadesMethodology';
import { TrazabilidadGastoMethodology } from './TrazabilidadGastoMethodology';
import { ControlFiscalMethodology } from './ControlFiscalMethodology';
import { RiesgoFiscalMethodology } from './RiesgoFiscalMethodology';
import { GestionPublicaIndicators } from './GestionPublicaIndicators';
import { InformeMinHaciendaModal } from './InformeMinHaciendaModal';
import { SimuladorIncertidumbre } from './SimuladorIncertidumbre';
import { UnifiedMethodologyModal } from './UnifiedMethodologyModal';
import { EDANInventoryManager } from './EDANInventoryManager';
import { MicRModule } from './MicRModule';

export const EventosDashboard: React.FC = () => {
  const { state, addEvento, updateEvento, deleteEvento, addActivity } = useProject();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false);
  const [showCommissionSelector, setShowCommissionSelector] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<EmergenciaEvento | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'impact' | 'ops'>('impact');
  const [showInformeMinHacienda, setShowInformeMinHacienda] = useState<EmergenciaEvento | null>(null);
  const [showUnifiedMethodology, setShowUnifiedMethodology] = useState(false);
  const [selectedDeptForInventory, setSelectedDeptForInventory] = useState<{ deptName: string, eventId: string } | null>(null);
  const [selectedEventIdForInventory, setSelectedEventIdForInventory] = useState<string | null>(null);
  const [mapInteractionMode, setMapInteractionMode] = useState<'declaratoria' | 'inventario'>('declaratoria');
  const [showMicRForEvent, setShowMicRForEvent] = useState<string | null>(null);

  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [consolidatedSelection, setConsolidatedSelection] = useState<{
    eventIds: string[];
    depts: string[];
  }>({ eventIds: [], depts: [] });

  const emptyEvent = {
    nombre: '',
    tipo: 'Inundación' as const,
    departamentosAfectados: [],
    municipiosStr: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    descripcion: '',
    estado: 'Activo' as const
  };

  const [newEvent, setNewEvent] = useState<Partial<EmergenciaEvento> & { municipiosStr: string }>(emptyEvent);

  const toggleDepartment = (deptName: string) => {
    setNewEvent(prev => {
      const current = prev.departamentosAfectados || [];
      const exists = current.some(d => (d || '').toLowerCase() === (deptName || '').toLowerCase());
      if (exists) {
        return { ...prev, departamentosAfectados: current.filter(d => (d || '').toLowerCase() !== (deptName || '').toLowerCase()) };
      } else {
        return { ...prev, departamentosAfectados: [...current, deptName] };
      }
    });
  };

  const handleMapClick = (deptName: string) => {
    if (mapInteractionMode === 'inventario') {
      if (selectedEventIdForInventory) {
        setSelectedDeptForInventory({ deptName, eventId: selectedEventIdForInventory });
      } else {
        alert('Por favor seleccione un evento primero.');
      }
      return;
    }
    
    setNewEvent({
      ...emptyEvent,
      nombre: `Evento Sistémico - ${deptName}`,
      tipo: 'Frente Frío',
      departamentosAfectados: [deptName],
      descripcion: `Declaratoria de impacto sistémico iniciada desde cartografía para el departamento de ${deptName}.`,
    });
    setIsEditing(false);
    setShowNewModal(true);
  };

  const handleEditEvent = (evento: EmergenciaEvento) => {
    setNewEvent({
      ...evento,
      municipiosStr: (evento.municipiosAfectados || []).join(', ')
    });
    setIsEditing(true);
    setShowNewModal(true);
  };

  const handleAddEvent = () => {
    if (!newEvent.nombre || (newEvent.departamentosAfectados || []).length === 0) return;
    
    const eventData: EmergenciaEvento = {
      id: isEditing ? (newEvent.id as string) : `EV-${Date.now()}`,
      nombre: newEvent.nombre,
      tipo: newEvent.tipo as any,
      departamentosAfectados: newEvent.departamentosAfectados || [],
      municipiosAfectados: (newEvent.municipiosStr || '').split(',').map(s => s.trim()).filter(Boolean),
      fechaInicio: newEvent.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: newEvent.fechaFin,
      descripcion: newEvent.descripcion || '',
      estado: newEvent.estado as any,
      heatmapPoints: newEvent.heatmapPoints || []
    };

    if (isEditing) {
      updateEvento(eventData);
    } else {
      addEvento(eventData);
    }
    
    setShowNewModal(false);
    setNewEvent(emptyEvent);
    setIsEditing(false);
  };

  const handleGenerateHeatmap = (evento: EmergenciaEvento) => {
    // Mock generation of systemic impact points based on event type and departments
    const points: HeatMapPoint[] = [];
    const depts = evento.departamentosAfectados || [];
    
    const deptCoords: Record<string, [number, number]> = {
      'Antioquia': [-75.5, 7.0],
      'Chocó': [-76.8, 6.0],
      'Bolívar': [-74.5, 9.0],
      'Magdalena': [-74.2, 10.0],
      'Atlántico': [-74.9, 10.7],
      'La Guajira': [-72.5, 11.5],
      'Cundinamarca': [-74.2, 4.8],
      'Valle del Cauca': [-76.5, 3.8],
      'Cauca': [-76.8, 2.5],
      'Nariño': [-77.5, 1.5],
      'Huila': [-75.7, 2.5],
      'Meta': [-73.0, 3.5],
      'Santander': [-73.5, 7.0],
      'Norte de Santander': [-72.8, 8.0],
      'San Andrés y Providencia': [-78.5, 10.5]
    };

    depts.forEach(dept => {
      const coords = deptCoords[dept] || [-74.0, 4.5];
      points.push({
        lat: coords[1],
        lng: coords[0],
        intensity: 0.8 + Math.random() * 0.2,
        type: 'rain',
        radius: 15,
        description: `Precipitaciones extremas en ${dept}`
      });

      if (evento.tipo === 'Frente Frío' || (evento.nombre || '').toLowerCase().includes('frío') || (evento.nombre || '').toLowerCase().includes('viento')) {
        points.push({
          lat: coords[1] + 0.5,
          lng: coords[0] + 0.5,
          intensity: 0.7,
          type: 'wind',
          radius: 20,
          description: `Ráfagas de viento sistémicas`
        });
      }

      if (['Bolívar', 'Magdalena', 'Atlántico', 'La Guajira', 'Chocó'].includes(dept)) {
        points.push({
          lat: coords[1] - 0.3,
          lng: coords[0] - 0.3,
          intensity: 0.9,
          type: 'surge',
          radius: 12,
          description: `Alteración de oleaje y erosión costera`
        });
      }

      points.push({
        lat: coords[1] - 0.5,
        lng: coords[0] + 0.2,
        intensity: 0.6,
        type: 'temp',
        radius: 25,
        description: `Descenso térmico por masa de aire polar`
      });
    });

    const updatedEvento = {
      ...evento,
      heatmapPoints: points
    };
    // Update in store
    updateEvento(updatedEvento);
    setSelectedEventDetails(updatedEvento);
  };

  const generateTechnicalReport = (evento: EmergenciaEvento, metrics: any, activities: any[], comisiones: any[]) => {
    const doc = new jsPDF();

    // --- PAGINA 1: PORTADA ---
    doc.setFillColor(30, 41, 59); // Slate-900
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME TÉCNICO DE', 105, 80, { align: 'center' });
    doc.text('IMPACTO SISTÉMICO', 105, 95, { align: 'center' });
    
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.line(40, 110, 170, 110);
    
    doc.setFontSize(18);
    doc.text(evento.nombre.toUpperCase(), 105, 130, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`TIPO DE EVENTO: ${evento.tipo.toUpperCase()}`, 105, 145, { align: 'center' });
    doc.text(`FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 105, 155, { align: 'center' });
    
    doc.text('DIRIGIDO A: CONTRALORÍA GENERAL DE LA REPÚBLICA', 105, 240, { align: 'center' });
    doc.text('UNIDAD NACIONAL PARA LA GESTIÓN DEL RIESGO DE DESASTRES', 105, 250, { align: 'center' });

    // --- PAGINA 2: RESUMEN Y CARACTERIZACION ---
    doc.addPage();
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN EJECUTIVO Y CARACTERIZACIÓN', 15, 25);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text([
      `Evento: ${evento.nombre}`,
      `Fecha de Inicio: ${evento.fechaInicio}`,
      `Estado: ${evento.estado}`,
      `Departamentos Afectados: ${evento.departamentosAfectados.join(', ')}`,
      `Municipios: ${evento.municipiosAfectados.join(', ') || 'N/A'}`
    ], 20, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('1.1 Descripción del Fenómeno:', 15, 75);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(evento.descripcion, 170);
    doc.text(splitDesc, 20, 85);

    // --- PAGINA 3: ESFUERZO OPERATIVO ---
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('2. ESFUERZO OPERATIVO Y COSTEO INSTITUCIONAL', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('El presente apartado detalla la inversión en horas hombre y logística para la atención del evento.', 15, 35);

    autoTable(doc, {
      startY: 45,
      head: [['Indicador de Esfuerzo', 'Valor Cuantificado']],
      body: [
        ['Total Horas Hombre (HH)', `${metrics.horasHombre} HH`],
        ['Costo Estimado HH (Sueldos/Honorarios)', `$${metrics.costoHH.toLocaleString('es-CO')} COP`],
        ['Sesiones de PMU y Reuniones Técnicas', `${metrics.reunionesCount} sesiones`],
        ['Comisiones de Campo y Seguimiento', `${metrics.comisionesCount} misiones`],
        ['Inversión en Viáticos y Logística', `$${metrics.viaticos.toLocaleString('es-CO')} COP`],
        ['COSTO TOTAL OPERATIVO (HH + Logística)', `$${metrics.totalCosto.toLocaleString('es-CO')} COP`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] }
    });

    // Actividades Table
    const activityRows = activities.map(a => [
      a.date,
      a.title,
      a.type,
      `${a.durationHours}h`,
      a.participantIds.length,
      `${a.durationHours * a.participantIds.length} HH`
    ]);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const actY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('2.1 Detalle de Actividades y Tracking HH', 15, actY);

    autoTable(doc, {
      startY: actY + 5,
      head: [['Fecha', 'Actividad', 'Tipo', 'Dur.', 'Part.', 'Total HH']],
      body: activityRows.length > 0 ? activityRows : [['-', 'Sin registros', '-', '-', '-', '-']],
      theme: 'grid'
    });

    // --- PAGINA 4: MATRIZ DE IMPACTOS Y VALORACIÓN ECONÓMICA ---
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('3. MATRIZ DE IMPACTOS Y VALORACIÓN ECONÓMICA', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis sistémico de la relación entre el fenómeno y los daños identificados bajo el modelo CRA.', 15, 35);

    const matrixRows = [
      ['Infraestructura', 'Destechamientos, daños en redes', 'Viviendas afectadas', 'Alta'],
      ['Social', 'Desplazamiento, afectación salud', 'Familias damnificadas', 'Media-Alta'],
      ['Económico', 'Pérdida de cultivos, cierre puertos', 'Pérdidas en COP', 'Alta'],
      ['Ambiental', 'Erosión costera, remoción masa', 'Hectáreas/m lineales', 'Media']
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Tipología', 'Efecto Identificado', 'Variable de Medición', 'Severidad']],
      body: matrixRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const econY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('3.1 Metodología de Valoración Económica (CRA)', 15, econY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const econDesc = [
      'La valoración se basa en el modelo de Costo de Reposición Ajustado (CRA): VED = Σ (Q × CU × FD × FT).',
      'Q: Cantidad física cuantificada.',
      'CU: Costo Unitario de reposición a precios de mercado.',
      'FD: Factor de Daño (Leve: 0.1-0.3, Moderado: 0.4-0.6, Severo: 0.7-0.9, Colapso: 1.0).',
      'FT: Factor Territorial (Ajuste por logística regional 1.0 - 1.4).',
      '',
      'Este modelo garantiza la transparencia y auditabilidad de los recursos públicos ante la Contraloría.'
    ];
    doc.text(econDesc, 20, econY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('3.2 Justificación del Nexo Causal:', 15, econY + 60);
    doc.setFont('helvetica', 'normal');
    const nexoCausal = `Se establece un nexo causal directo entre el evento de ${evento.tipo} y los impactos reportados, fundamentado en la coincidencia espacio-temporal de los fenómenos hidrometeorológicos registrados por el IDEAM y las afectaciones validadas en campo por las comisiones técnicas de la UNGRD.`;
    doc.text(doc.splitTextToSize(nexoCausal, 170), 20, econY + 70);

    // --- PAGINA 5: CONCLUSIONES ---
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('4. CONCLUSIONES Y RECOMENDACIONES', 15, 25);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const conclusiones = [
      '1. El evento ha generado un impacto sistémico significativo en la región caribe e insular.',
      '2. El esfuerzo operativo institucional ha sido proporcional a la magnitud de la amenaza.',
      '3. Se requiere mantener el monitoreo activo y la coordinación con los entes territoriales.',
      '4. La inversión reportada se encuentra debidamente soportada en el tracking de actividades y comisiones.'
    ];
    doc.text(conclusiones, 20, 40);

    doc.save(`Informe_Tecnico_Contraloria_${evento.nombre.replace(/\s+/g, '_')}.pdf`);
  };

  const getEventMetrics = (eventId: string) => {
    const event = state.eventos?.find(e => e.id === eventId);
    const reuniones = (state.activities || []).filter(a => a.eventoId === eventId);
    const comisiones = (state.comisiones || []).filter(c => c.eventoId === eventId || (event?.comisionesIds || []).includes(c.id));
    
    let horasHombre = 0;
    let costoHH = 0;
    let costoHHReuniones = 0;
    let costoHHComisiones = 0;
    let hhReuniones = 0;
    let hhComisiones = 0;

    reuniones.forEach(r => {
      const numParticipantes = Math.max(1, (r.participantIds || []).length);
      const hh = (r.durationHours || 1) * numParticipantes;
      horasHombre += hh;
      hhReuniones += hh;
      
      // Calculate cost based on professional hourly value
      r.participantIds.forEach(pid => {
        const prof = state.professionals.find(p => p.id === pid);
        if (prof) {
          const cost = (r.durationHours || 1) * prof.valorHora;
          costoHH += cost;
          costoHHReuniones += cost;
        }
      });
    });

    comisiones.forEach(c => {
      // Use numeroDias if available (allows 2.5, 3.5 etc), otherwise calculate from dates
      let diffDays = c.numeroDias;
      if (!diffDays) {
        const s = new Date(c.fechaInicio);
        const e = new Date(c.fechaFin);
        const durationMs = Math.abs(e.getTime() - s.getTime());
        diffDays = durationMs === 0 ? 1 : (durationMs / (1000 * 60 * 60 * 24)) + 1;
      }
      
      const numProfesionales = Math.max(1, (c.professionalIds || []).length);
      const hh = diffDays * 8 * numProfesionales;
      horasHombre += hh;
      hhComisiones += hh;

      c.professionalIds.forEach(pid => {
        const prof = state.professionals.find(p => p.id === pid);
        if (prof) {
          const cost = diffDays * 8 * prof.valorHora;
          costoHH += cost;
          costoHHComisiones += cost;
        }
      });
    });

    const viaticos = comisiones.reduce((sum, c) => sum + (c.costosAdicionales?.viaticos || 0) + (c.costosAdicionales?.transporte || 0) + (c.costosAdicionales?.alojamiento || 0), 0);

    // Calculate machinery costs
    const solicitudesMaquinaria = event?.solicitudesMaquinaria || [];
    let horasMaquinaria = 0;
    solicitudesMaquinaria.forEach(s => {
      horasMaquinaria += s.horasSolicitadas || 0;
    });
    // Assuming an average cost of 150,000 COP per hour of machinery
    const costoMaquinaria = horasMaquinaria * 150000;

    return {
      reunionesCount: reuniones.length,
      comisionesCount: comisiones.length,
      horasHombre,
      costoHH,
      viaticos,
      totalCosto: costoHH + viaticos + costoMaquinaria,
      hhReuniones,
      costoHHReuniones,
      hhComisiones,
      costoHHComisiones,
      horasMaquinaria,
      costoMaquinaria,
      solicitudesMaquinariaCount: solicitudesMaquinaria.length
    };
  };

  const { globalMetrics, chartData, typeData } = useMemo(() => {
    const metrics = {
      total: state.eventos?.length || 0,
      activos: (state.eventos || []).filter(e => e.estado === 'Activo').length,
      horasHombre: 0,
      viaticos: 0,
      costoHH: 0,
      totalCosto: 0
    };

    const cData = (state.eventos || []).map(ev => {
      const evMetrics = getEventMetrics(ev.id);
      metrics.horasHombre += evMetrics.horasHombre;
      metrics.viaticos += evMetrics.viaticos;
      metrics.costoHH += evMetrics.costoHH;
      metrics.totalCosto += evMetrics.totalCosto;
      return {
        name: ev.nombre,
        'Horas Hombre': evMetrics.horasHombre,
        'Viáticos (M)': evMetrics.viaticos / 1000000,
        'Comisiones': evMetrics.comisionesCount
      };
    });

    const tData = (state.eventos || []).reduce((acc, ev) => {
      const existing = acc.find(item => item.name === ev.tipo);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: ev.tipo, value: 1 });
      }
      return acc;
    }, [] as {name: string, value: number}[]);

    return { globalMetrics: metrics, chartData: cData, typeData: tData };
  }, [state.eventos, state.activities, state.comisiones]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldAlert className="text-indigo-600" size={32} />
            Centro de Eventos Nacionales
          </h1>
          <p className="text-slate-500 mt-2">Monitoreo de emergencias de impacto nacional y trazabilidad de recursos operativos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowConsolidatedModal(true)}
            className="bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            <BarChart3 size={20} className="text-emerald-500" />
            Análisis Consolidado
          </button>
          <button 
            onClick={() => {
              setIsEditing(false);
              setNewEvent(emptyEvent);
              setShowNewModal(true);
            }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all"
          >
            <Plus size={20} />
            Declarar Evento Nacional
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CloudRain size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Eventos</p>
            <p className="text-2xl font-black text-slate-800">{globalMetrics.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Eventos Activos</p>
            <p className="text-2xl font-black text-slate-800">{globalMetrics.activos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Esfuerzo Operativo</p>
            <p className="text-2xl font-black text-slate-800">{globalMetrics.horasHombre} <span className="text-sm font-medium text-slate-500">hrs</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Costo Operativo Total</p>
            <p className="text-2xl font-black text-slate-800">${(globalMetrics.totalCosto / 1000000).toFixed(1)}<span className="text-sm font-medium text-slate-500">M</span></p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {(state.eventos || []).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-indigo-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Impacto Operativo por Evento</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Horas Hombre" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar yAxisId="right" dataKey="Viáticos (M)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="text-indigo-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Distribución por Tipo</h3>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Eventos */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="text-slate-400" size={24} />
          Eventos Registrados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(state.eventos || []).map(evento => {
            const metrics = getEventMetrics(evento.id);
            return (
              <div 
                key={evento.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer"
                onClick={() => setSelectedEventDetails(evento)}
              >
                <div className="p-6 border-b border-slate-100 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      evento.estado === 'Activo' ? 'bg-red-100 text-red-700 border border-red-200' :
                      evento.estado === 'Controlado' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <span className="flex items-center gap-1">
                        {evento.estado === 'Activo' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                        {evento.estado}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(evento);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Editar Evento"
                      >
                        <Settings size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventToDelete(evento.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Evento"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                        {evento.tipo}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-3 line-clamp-2">{evento.nombre}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" /> 
                      <div>
                        <p className="font-medium">Impacto Territorial:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(evento.departamentosAfectados || []).slice(0, 3).map(d => (
                            <span key={d} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{d}</span>
                          ))}
                          {(evento.departamentosAfectados || []).length > 3 && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">+{evento.departamentosAfectados.length - 3} más</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={16} className="text-slate-400 shrink-0" /> 
                      <span>{evento.fechaInicio} {evento.fechaFin ? ` - ${evento.fechaFin}` : ' - Presente'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Comisiones</p>
                      <p className="text-sm font-black text-emerald-600">{metrics.comisionesCount} Misiones</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Esfuerzo</p>
                      <p className="text-sm font-black text-indigo-600">{metrics.horasHombre.toFixed(1)} HH</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Logística</p>
                      <p className="text-sm font-black text-amber-600">${(metrics.viaticos / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Total Operativo</p>
                      <p className="text-sm font-black">${(metrics.totalCosto / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setShowMicRForEvent(evento.id)}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Database size={16} />
                      Análisis MIC-R / PMU
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedEventDetails(evento);
                        }}
                        className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors shadow-sm flex items-center justify-center gap-2"
                      >
                        <Layers size={16} />
                        Impacto Sistémico
                      </button>
                      <button 
                        onClick={() => setShowInformeMinHacienda(evento)}
                        className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                        title="Generar Informe Técnico MinHacienda"
                      >
                        <FileText size={16} />
                        MinHacienda
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {(state.eventos || []).length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No hay eventos nacionales registrados</h3>
              <p className="text-slate-500 max-w-md mx-auto">Declara un evento de emergencia para comenzar a trazar su impacto territorial y el esfuerzo operativo de la entidad.</p>
              <button 
                onClick={() => setShowNewModal(true)}
                className="mt-6 bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
              >
                Declarar Primer Evento
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal MIC-R & PMU Scoped to Event */}
      {showMicRForEvent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <MicRModule 
              initialEventId={showMicRForEvent} 
              onClose={() => setShowMicRForEvent(null)} 
            />
          </div>
        </div>
      )}

      {/* Modal Análisis Consolidado */}
      {showConsolidatedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-900 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Análisis Consolidado Multivariado</h3>
                  <p className="text-xs text-emerald-300 uppercase tracking-widest font-bold">Generación de Reporte Agregado • Costos y Esfuerzo</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConsolidatedModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CloudRain size={18} className="text-indigo-500" />
                    Seleccionar Eventos (Frentes Fríos)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {(state.eventos || []).filter(e => e.tipo === 'Frente Frío').map(ev => (
                      <label key={ev.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={consolidatedSelection.eventIds.includes(ev.id)}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...consolidatedSelection.eventIds, ev.id]
                              : consolidatedSelection.eventIds.filter(id => id !== ev.id);
                            setConsolidatedSelection({...consolidatedSelection, eventIds: ids});
                          }}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{ev.nombre}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{ev.fechaInicio} • {ev.departamentosAfectados.length} Deptos</p>
                        </div>
                      </label>
                    ))}
                    {(state.eventos || []).filter(e => e.tipo === 'Frente Frío').length === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-4">No hay eventos de tipo Frente Frío registrados.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-emerald-500" />
                    Filtrar por Territorio
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2">
                    {['Antioquia', 'Chocó', 'Córdoba', 'Bolívar', 'Magdalena', 'Atlántico', 'La Guajira', 'Cundinamarca', 'Valle del Cauca', 'Cauca', 'Nariño', 'Huila', 'Meta', 'Santander', 'Norte de Santander', 'San Andrés y Providencia'].map(dept => (
                      <button 
                        key={dept}
                        onClick={() => {
                          const depts = consolidatedSelection.depts.includes(dept)
                            ? consolidatedSelection.depts.filter(d => d !== dept)
                            : [...consolidatedSelection.depts, dept];
                          setConsolidatedSelection({...consolidatedSelection, depts});
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          consolidatedSelection.depts.includes(dept)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Database size={18} className="text-indigo-500" />
                  Variables a Incluir en el Análisis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Precipitación', 'Viento', 'Temperatura', 'Costos HH', 'Viáticos', 'Impacto Social', 'Infraestructura', 'Nexo Causal'].map(v => (
                    <div key={v} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-xs font-bold text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={() => setShowConsolidatedModal(false)}
                className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const selectedEvents = (state.eventos || []).filter(e => consolidatedSelection.eventIds.includes(e.id));
                  if (selectedEvents.length === 0) {
                    alert('Por favor seleccione al menos un evento.');
                    return;
                  }

                  const doc = new jsPDF();
                  
                  // Header
                  doc.setFillColor(16, 185, 129); // Emerald-600
                  doc.rect(0, 0, 210, 40, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(22);
                  doc.text('ANÁLISIS CONSOLIDADO DE IMPACTO SISTÉMICO', 105, 20, { align: 'center' });
                  doc.setFontSize(14);
                  doc.text(`CONSOLIDADO DE ${selectedEvents.length} EVENTOS SELECCIONADOS`, 105, 30, { align: 'center' });

                  // Section 1: Resumen Agregado
                  doc.setTextColor(30, 41, 59);
                  doc.setFontSize(16);
                  doc.text('1. RESUMEN AGREGADO DE COSTOS Y ESFUERZO', 15, 55);
                  
                  let totalHH = 0;
                  let totalCostoHH = 0;
                  let totalViaticos = 0;
                  let totalDeptos = new Set<string>();

                  selectedEvents.forEach(ev => {
                    const m = getEventMetrics(ev.id);
                    totalHH += m.horasHombre;
                    totalCostoHH += m.costoHH;
                    totalViaticos += m.viaticos;
                    ev.departamentosAfectados.forEach(d => totalDeptos.add(d));
                  });

                  autoTable(doc, {
                    startY: 60,
                    head: [['Indicador Consolidado', 'Valor Total']],
                    body: [
                      ['Eventos Analizados', `${selectedEvents.length} eventos`],
                      ['Departamentos Impactados', `${totalDeptos.size} territorios`],
                      ['Total Horas Hombre (HH)', `${totalHH} HH`],
                      ['Costo Total HH (Sueldos/Honorarios)', `$${totalCostoHH.toLocaleString('es-CO')} COP`],
                      ['Total Inversión Logística (Viáticos)', `$${totalViaticos.toLocaleString('es-CO')} COP`],
                      ['COSTO TOTAL OPERATIVO CONSOLIDADO', `$${(totalCostoHH + totalViaticos).toLocaleString('es-CO')} COP`]
                    ],
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] }
                  });

                  // Section 2: Detalle por Evento
                  doc.setFontSize(16);
                  const nextY = (doc as any).lastAutoTable.finalY + 15;
                  doc.text('2. DESGLOSE DETALLADO POR EVENTO', 15, nextY);

                  const eventRows = selectedEvents.map(ev => {
                    const m = getEventMetrics(ev.id);
                    return [
                      ev.nombre,
                      ev.fechaInicio,
                      `${m.horasHombre} HH`,
                      `$${m.costoHH.toLocaleString('es-CO')}`,
                      `$${m.viaticos.toLocaleString('es-CO')}`,
                      `$${(m.costoHH + m.viaticos).toLocaleString('es-CO')}`
                    ];
                  });

                  autoTable(doc, {
                    startY: nextY + 5,
                    head: [['Evento', 'Inicio', 'HH', 'Costo HH', 'Viáticos', 'Total']],
                    body: eventRows,
                    theme: 'grid',
                    headStyles: { fillColor: [51, 65, 85] }
                  });

                  // Section 3: Metodología Aplicada
                  doc.addPage();
                  doc.setFontSize(16);
                  doc.text('3. MARCO METODOLÓGICO DE CARACTERIZACIÓN', 15, 20);
                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(10);
                  
                  let currentY = 30;
                  doc.text('3.1 VARIABLES OBLIGATORIAS:', 15, currentY);
                  currentY += 7;
                  doc.text('• Duración: Persistencia del sistema sobre el territorio nacional.', 20, currentY); currentY += 7;
                  doc.text('• Intensidad: Gradiente de presión y velocidad de desplazamiento.', 20, currentY); currentY += 7;
                  doc.text('• Cobertura: Extensión geográfica afectada.', 20, currentY); currentY += 7;
                  doc.text('• Anomalías: Desviación estándar respecto a la media histórica.', 20, currentY); currentY += 7;

                  currentY += 5;
                  doc.text('3.2 INDICADORES MEDIBLES:', 15, currentY);
                  currentY += 7;
                  doc.text('• Precipitación: mm/24h (Umbral crítico > 50mm en zonas vulnerables).', 20, currentY); currentY += 7;
                  doc.text('• Viento: Nudos/km/h (Ráfagas > 40 km/h para alerta).', 20, currentY); currentY += 7;
                  doc.text('• Temperatura: Descenso térmico (> 3°C por debajo de la media local).', 20, currentY); currentY += 7;
                  doc.text('• Oleaje: Altura significativa de la ola (m) en zonas costeras.', 20, currentY); currentY += 7;

                  doc.save('Analisis_Consolidado_Sistemico.pdf');
                  setShowConsolidatedModal(false);
                }}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
              >
                Generar Reporte Consolidado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestión de Inventario */}
      {selectedDeptForInventory && (
        <EDANInventoryManager 
          deptName={selectedDeptForInventory.deptName} 
          eventId={selectedDeptForInventory.eventId}
          onClose={() => setSelectedDeptForInventory(null)} 
        />
      )}

      {selectedEventDetails && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden animate-in zoom-in duration-300 flex flex-col h-full sm:h-[95vh]">
            {/* Header Extenso */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 border-b border-white/10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                  <CloudRain size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black">{selectedEventDetails.nombre}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedEventDetails.estado === 'Activo' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {selectedEventDetails.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                    <span className="flex items-center gap-1.5"><Activity size={14} /> {selectedEventDetails.tipo}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Inició: {selectedEventDetails.fechaInicio}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {selectedEventDetails.departamentosAfectados.join(', ')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const metrics = getEventMetrics(selectedEventDetails.id);
                    const eventActivities = (state.activities || []).filter(a => a.eventoId === selectedEventDetails.id);
                    const eventComisiones = (state.comisiones || []).filter(c => c.eventoId === selectedEventDetails.id);
                    generateTechnicalReport(selectedEventDetails, metrics, eventActivities, eventComisiones);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-bold"
                >
                  <FileText size={18} />
                  Exportar Informe
                </button>
                <button 
                  onClick={() => setSelectedEventDetails(null)} 
                  className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Sub-Tabs de Navegación */}
            <div className="bg-white border-b border-slate-200 px-8 flex gap-8 shrink-0">
              <button 
                onClick={() => setActiveDetailTab('impact')}
                className={`py-4 text-sm font-black transition-all border-b-2 ${activeDetailTab === 'impact' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                IMPACTO Y CUANTIFICACIÓN
              </button>
              <button 
                onClick={() => setActiveDetailTab('ops')}
                className={`py-4 text-sm font-black transition-all border-b-2 ${activeDetailTab === 'ops' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                GESTIÓN OPERATIVA
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {activeDetailTab === 'impact' ? (
                <>
                  {/* Mapa de Impacto Sistémico - Prominente */}
                  <div className="p-8">
                    <div className="bg-white p-1 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative group">
                      <div className="absolute top-8 left-8 z-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg max-w-xs">
                        <h4 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                          <Layers size={16} className="text-indigo-600" />
                          MAPA DE IMPACTO SISTÉMICO
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Visualización georreferenciada de la intensidad del fenómeno y sus efectos en el territorio nacional.
                        </p>
                      </div>
                      <div className="h-[500px] w-full rounded-[2.2rem] overflow-hidden">
                        <EventColombiaMap 
                          evento={selectedEventDetails} 
                          onDepartmentClick={(deptName) => {
                            setSelectedDeptForInventory({ deptName, eventId: selectedEventDetails.id });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna Izquierda: Métricas y Cuantificación */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* KPIs de Impacto */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Personas Impactadas</p>
                          <p className="text-3xl font-black text-slate-800">{selectedEventDetails.metrics?.poblacionImpactada?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Viviendas Dañadas</p>
                          <p className="text-3xl font-black text-slate-800">{selectedEventDetails.metrics?.viviendasDanadas?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Infraestructura (Km)</p>
                          <p className="text-3xl font-black text-slate-800">{selectedEventDetails.metrics?.infraestructuraAfectada?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Costo Estimado</p>
                          <p className="text-3xl font-black text-emerald-600">${((selectedEventDetails.metrics?.costoReparacion || 0) / 1000000).toFixed(1)}M</p>
                        </div>
                      </div>

                      {/* Cuantificación Detallada (NUEVA SECCIÓN) */}
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                          <Database size={20} className="text-indigo-600" />
                          CUANTIFICACIÓN TÉCNICA DETALLADA
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Waves size={20} /></div>
                              <h5 className="font-bold text-slate-700">Acueductos</h5>
                            </div>
                            <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-800">
                                {selectedEventDetails.metrics?.acueductosAfectados?.[0]?.cantidad || 0}
                              </p>
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                Tipo: {selectedEventDetails.metrics?.acueductosAfectados?.[0]?.tipo || 'No especificado'}
                              </p>
                            </div>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Activity size={20} /></div>
                              <h5 className="font-bold text-slate-700">Puentes</h5>
                            </div>
                            <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-800">
                                {selectedEventDetails.metrics?.puentesAfectados?.cantidad || 0}
                              </p>
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                Longitud: {selectedEventDetails.metrics?.puentesAfectados?.longitudTotal || 0}m totales
                              </p>
                            </div>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Zap size={20} /></div>
                              <h5 className="font-bold text-slate-700">Servicios Públicos</h5>
                            </div>
                            <div className="space-y-1">
                              <p className="text-2xl font-black text-slate-800">
                                {selectedEventDetails.metrics?.usuariosSinServicioPublico?.toLocaleString() || 0}
                              </p>
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                Usuarios sin servicio
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Descripción y Análisis */}
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-black text-slate-800 mb-4">Descripción del Evento</h4>
                        <p className="text-slate-600 leading-relaxed text-lg">{selectedEventDetails.descripcion}</p>
                        
                        <div className="mt-8 pt-8 border-t border-slate-100">
                          <h4 className="text-lg font-black text-slate-800 mb-4">Caracterización Técnica (IDEAM)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duración</p>
                              <p className="font-bold text-slate-700">{selectedEventDetails.caracterizacion?.duracionDias || 0} días</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Intensidad</p>
                              <p className="font-bold text-slate-700">{selectedEventDetails.caracterizacion?.intensidadDesc || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Anomalía</p>
                              <p className="font-bold text-slate-700">{selectedEventDetails.caracterizacion?.anomaliaClimatica || 0}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Amenaza</p>
                              <p className="font-bold text-slate-700">{selectedEventDetails.caracterizacion?.tipoAmenaza || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <ImpactMatrix />
                      <div className="mt-8 space-y-8">
                        <SimuladorIncertidumbre evento={selectedEventDetails} />
                        <CuantificacionFisicaMethodology />
                        <ValoracionEconomicaMethodology />
                        <DanosVsNecesidadesMethodology />
                        <TrazabilidadGastoMethodology />
                        <ControlFiscalMethodology />
                        <RiesgoFiscalMethodology />
                        <GestionPublicaIndicators />
                      </div>
                    </div>

                    {/* Columna Derecha: Consolidado de Inversión y Eficiencia */}
                    <div className="space-y-8">
                      {/* Consolidado de Costos Operativos */}
                      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                        <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                          <Calculator size={20} className="text-indigo-400" />
                          COSTOS OPERATIVOS (UNGRD)
                        </h4>
                        
                        {(() => {
                          const metrics = getEventMetrics(selectedEventDetails.id);
                          return (
                            <div className="space-y-6">
                              {/* Comisiones */}
                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-indigo-300 font-bold text-sm flex items-center gap-2"><MapPin size={14}/> Comisiones en Territorio</span>
                                  <span className="text-lg font-black">{metrics.comisionesCount}</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Horas-Hombre Invertidas</span>
                                    <span className="text-sm font-bold">{metrics.hhComisiones.toFixed(1)} HH</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Costo HH Estimado</span>
                                    <span className="text-sm font-bold">${(metrics.costoHHComisiones / 1000000).toFixed(1)}M</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Viáticos y Logística</span>
                                    <span className="text-sm font-bold">${(metrics.viaticos / 1000000).toFixed(1)}M</span>
                                  </div>
                                </div>
                              </div>

                              {/* Reuniones PMU */}
                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-amber-300 font-bold text-sm flex items-center gap-2"><Users size={14}/> Reuniones PMU / Técnicas</span>
                                  <span className="text-lg font-black">{metrics.reunionesCount}</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Horas-Hombre Invertidas</span>
                                    <span className="text-sm font-bold">{metrics.hhReuniones.toFixed(1)} HH</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Costo HH Estimado</span>
                                    <span className="text-sm font-bold">${(metrics.costoHHReuniones / 1000000).toFixed(1)}M</span>
                                  </div>
                                </div>
                              </div>

                              {/* Maquinaria Amarilla */}
                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-emerald-300 font-bold text-sm flex items-center gap-2"><Settings size={14}/> Maquinaria Amarilla</span>
                                  <span className="text-lg font-black">{metrics.solicitudesMaquinariaCount}</span>
                                </div>
                                <div className="space-y-2 pl-6">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Horas Solicitadas</span>
                                    <span className="text-sm font-bold">{metrics.horasMaquinaria} Hrs</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-xs">Costo Estimado (150k/hr)</span>
                                    <span className="text-sm font-bold">${(metrics.costoMaquinaria / 1000000).toFixed(1)}M</span>
                                  </div>
                                </div>
                              </div>

                              {/* Totales */}
                              <div className="pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-slate-300 text-sm">Total Horas-Hombre (OPS)</span>
                                  <span className="text-xl font-black">{metrics.horasHombre.toFixed(1)} HH</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-indigo-400 font-bold">TOTAL OPERATIVO</span>
                                  <span className="text-3xl font-black text-indigo-400">${(metrics.totalCosto / 1000000).toFixed(1)}M</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Composición del Daño */}
                      {selectedEventDetails.metrics?.tipoEventoComposition && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                          <h4 className="text-lg font-black text-slate-800 mb-6">Composición del Daño</h4>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(selectedEventDetails.metrics.tipoEventoComposition).map(([name, value]) => ({ name, value }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {Object.entries(selectedEventDetails.metrics.tipoEventoComposition).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-4 space-y-2">
                            {Object.entries(selectedEventDetails.metrics.tipoEventoComposition).map(([name, value], index) => (
                              <div key={name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                  <span className="text-slate-600 font-medium">{name}</span>
                                </div>
                                <span className="font-bold text-slate-800">{value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Territorios Afectados */}
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-lg font-black text-slate-800 mb-4">Territorios Afectados</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Departamentos</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedEventDetails.departamentosAfectados.map(d => (
                                <span key={d} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                          {selectedEventDetails.municipiosAfectados && selectedEventDetails.municipiosAfectados.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Municipios ({selectedEventDetails.municipiosAfectados.length})</p>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                                {selectedEventDetails.municipiosAfectados.map(m => (
                                  <span key={m} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md border border-slate-200">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Botón MIC-R */}
                      <button 
                        onClick={() => {
                          alert('Redirigiendo a MIC-R para cuantificación detallada...');
                          setSelectedEventDetails(null);
                        }}
                        className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
                      >
                        <Database size={24} className="group-hover:scale-110 transition-transform" />
                        GESTIONAR MIC-R
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Programación de Reuniones */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <Calendar size={20} className="text-indigo-600" />
                          PROGRAMACIÓN DE REUNIONES / PMU
                        </h4>
                        <button 
                          onClick={() => {
                            const title = prompt('Título de la reunión:');
                            if (title) {
                              const newActivity: ActivityType = {
                                id: Math.random().toString(36).substr(2, 9),
                                title,
                                type: 'Reunión',
                                date: new Date().toISOString().split('T')[0],
                                durationHours: 2,
                                eventoId: selectedEventDetails.id,
                                participantIds: [],
                                description: 'Reunión programada desde el dashboard de eventos.'
                              };
                              addActivity(newActivity);
                            }
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"
                        >
                          + Programar Reunión
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {(state.activities || []).filter(a => a.eventoId === selectedEventDetails.id).length > 0 ? (
                          (state.activities || []).filter(a => a.eventoId === selectedEventDetails.id).map(activity => (
                            <div key={activity.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-indigo-600">
                                  <Users size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{activity.title}</p>
                                  <p className="text-xs text-slate-500">{activity.date} • {activity.durationHours} horas</p>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full uppercase">
                                {activity.type}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-slate-400 italic text-sm">
                            No hay reuniones programadas para este evento.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Solicitudes de Maquinaria Amarilla */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <Truck size={20} className="text-amber-600" />
                          SOLICITUDES DE MAQUINARIA AMARILLA
                        </h4>
                        <button 
                          onClick={() => {
                            const municipio = prompt('Municipio solicitante:');
                            const horas = prompt('Horas solicitadas:');
                            if (municipio && horas) {
                              const newSolicitud: SolicitudMaquinaria = {
                                id: Math.random().toString(36).substr(2, 9),
                                municipio,
                                departamento: selectedEventDetails.departamentosAfectados[0] || 'Desconocido',
                                horasSolicitadas: parseInt(horas),
                                tipoMaquinaria: 'Retroexcavadora / Volqueta',
                                estado: 'Pendiente',
                                fechaSolicitud: new Date().toISOString().split('T')[0]
                              };
                              const updatedEvento = {
                                ...selectedEventDetails,
                                solicitudesMaquinaria: [...(selectedEventDetails.solicitudesMaquinaria || []), newSolicitud]
                              };
                              updateEvento(updatedEvento);
                              setSelectedEventDetails(updatedEvento);
                            }
                          }}
                          className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all"
                        >
                          + Nueva Solicitud
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(selectedEventDetails.solicitudesMaquinaria || []).length > 0 ? (
                          (selectedEventDetails.solicitudesMaquinaria || []).map(solicitud => (
                            <div key={solicitud.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-slate-800">{solicitud.municipio} ({solicitud.departamento})</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  solicitud.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                                  solicitud.estado === 'Aprobada' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {solicitud.estado}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{solicitud.tipoMaquinaria}</span>
                                <span className="font-black text-slate-700">{solicitud.horasSolicitadas} Horas</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-slate-400 italic text-sm">
                            No hay solicitudes de maquinaria registradas.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comisiones Vinculadas al Evento */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <ShieldAlert size={20} className="text-rose-600" />
                        COMISIONES VINCULADAS AL MARCO DEL EVENTO
                      </h4>
                      <button 
                        onClick={() => setShowCommissionSelector(true)}
                        className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all"
                      >
                        + Vincular Comisión
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(selectedEventDetails.comisionesIds || []).length > 0 ? (
                        (selectedEventDetails.comisionesIds || []).map(comId => {
                          const comision = state.comisiones.find(c => c.id === comId);
                          if (!comision) return null;
                          return (
                            <div key={comId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-rose-600">
                                  <Users size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800 uppercase">{comision.responsableNombre}</p>
                                  <p className="text-[10px] text-slate-500">{comision.tipoComision}</p>
                                </div>
                              </div>
                              <div className="space-y-1 mb-3">
                                <p className="text-[10px] text-slate-600 flex items-center gap-1">
                                  <MapPin size={10} /> {comision.departamento} - {comision.municipios}
                                </p>
                                <p className="text-[10px] text-slate-600 flex items-center gap-1">
                                  <Calendar size={10} /> {comision.fechaInicio} al {comision.fechaFin}
                                </p>
                              </div>
                              <button 
                                onClick={() => {
                                  const updated = {
                                    ...selectedEventDetails,
                                    comisionesIds: (selectedEventDetails.comisionesIds || []).filter(id => id !== comId)
                                  };
                                  updateEvento(updated);
                                  setSelectedEventDetails(updated);
                                }}
                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full text-center py-12 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-3xl">
                          No hay comisiones vinculadas a este evento.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Evento */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-white" />
                <h3 className="text-xl font-bold">Eliminar Evento</h3>
              </div>
              <button onClick={() => setEventToDelete(null)} className="text-rose-200 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                ¿Está seguro de eliminar este evento nacional? Se perderá toda la trazabilidad asociada, incluyendo actividades y comisiones.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEventToDelete(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteEvento(eventToDelete);
                    setEventToDelete(null);
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

      {/* Modal Nuevo Evento */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-amber-300" />
                <h3 className="text-xl font-bold">{isEditing ? 'Editar Evento Nacional' : 'Declarar Evento Nacional'}</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-indigo-200 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Evento *</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="Ej. Fenómeno de La Niña 2024-2025"
                    value={newEvent.nombre}
                    onChange={(e) => setNewEvent({ ...newEvent, nombre: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Evento</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newEvent.tipo}
                    onChange={(e) => setNewEvent({ ...newEvent, tipo: e.target.value as any })}
                  >
                    <option value="Inundación">Inundación</option>
                    <option value="Deslizamiento">Deslizamiento</option>
                    <option value="Sismo">Sismo</option>
                    <option value="Incendio Forestal">Incendio Forestal</option>
                    <option value="Sequía">Sequía</option>
                    <option value="Frente Frío">Frente Frío (Sistémico)</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado Inicial</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newEvent.estado}
                    onChange={(e) => setNewEvent({ ...newEvent, estado: e.target.value as any })}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Controlado">Controlado</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Departamentos Afectados (Selección en Mapa) *</label>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ColombiaSelectionMap 
                        selectedDepartments={newEvent.departamentosAfectados || []}
                        onToggleDepartment={toggleDepartment}
                        height={400}
                        events={state.eventos || []}
                      />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col">
                      <h5 className="text-xs font-bold text-slate-400 uppercase mb-3">Seleccionados: {(newEvent.departamentosAfectados || []).length}</h5>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {(newEvent.departamentosAfectados || []).map(dept => (
                          <div key={dept} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                            <span className="text-sm font-medium text-slate-700">{dept}</span>
                            <button 
                              onClick={() => toggleDepartment(dept)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(newEvent.departamentosAfectados || []).length === 0 && (
                          <div className="text-center py-8 text-slate-400 italic text-xs">
                            Seleccione departamentos en el mapa para agregarlos al evento.
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-[10px] text-slate-400 leading-tight">
                          La declaratoria de un **Frente Frío** o evento sistémico requiere la selección de múltiples departamentos para proyectar su impacto real.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Municipios Específicos (Opcional)</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Quibdó, Lloró, Bagadó (Separados por coma)"
                    value={newEvent.municipiosStr}
                    onChange={(e) => setNewEvent({ ...newEvent, municipiosStr: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Inicio *</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formatDateForInput(newEvent.fechaInicio || '')}
                    onChange={(e) => setNewEvent({ ...newEvent, fechaInicio: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Fin Estimada (Opcional)</label>
                  <input 
                    type="date" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newEvent.fechaFin ? formatDateForInput(newEvent.fechaFin) : ''}
                    onChange={(e) => setNewEvent({ ...newEvent, fechaFin: e.target.value })}
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción y Contexto</label>
                  <textarea 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    placeholder="Detalles del evento, declaratorias asociadas, impacto inicial..."
                    value={newEvent.descripcion}
                    onChange={(e) => setNewEvent({ ...newEvent, descripcion: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowNewModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddEvent}
                disabled={!newEvent.nombre || (newEvent.departamentosAfectados || []).length === 0}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isEditing ? 'Guardar Cambios' : 'Declarar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showInformeMinHacienda && (
        <InformeMinHaciendaModal 
          evento={showInformeMinHacienda} 
          onClose={() => setShowInformeMinHacienda(null)} 
        />
      )}
      {showUnifiedMethodology && (
        <UnifiedMethodologyModal 
          onClose={() => setShowUnifiedMethodology(false)} 
        />
      )}

      {/* Modal Selector de Comisiones */}
      {showCommissionSelector && selectedEventDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-rose-600 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <ShieldAlert size={28} />
                  VINCULAR COMISIÓN
                </h3>
                <p className="text-rose-100 text-sm font-medium mt-1">Seleccione una comisión para vincularla al evento: {selectedEventDetails.nombre}</p>
              </div>
              <button 
                onClick={() => setShowCommissionSelector(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {state.comisiones.length > 0 ? (
                  state.comisiones
                    .filter(c => !(selectedEventDetails.comisionesIds || []).includes(c.id))
                    .map(comision => (
                      <div 
                        key={comision.id} 
                        className="p-5 bg-slate-50 rounded-3xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer group"
                        onClick={() => {
                          const updated = {
                            ...selectedEventDetails,
                            comisionesIds: [...(selectedEventDetails.comisionesIds || []), comision.id]
                          };
                          updateEvento(updated);
                          setSelectedEventDetails(updated);
                          setShowCommissionSelector(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                              <Users size={24} />
                            </div>
                            <div>
                              <p className="font-black text-slate-800 uppercase leading-tight">{comision.responsableNombre}</p>
                              <p className="text-xs text-slate-500 font-bold">{comision.tipoComision} • {comision.departamento}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</p>
                            <p className="text-xs font-bold text-slate-700">{comision.fechaInicio}</p>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-12 text-slate-400 italic">
                    No hay comisiones disponibles para vincular.
                  </div>
                )}
                
                {state.comisiones.filter(c => !(selectedEventDetails.comisionesIds || []).includes(c.id)).length === 0 && state.comisiones.length > 0 && (
                  <div className="text-center py-12 text-slate-400 italic">
                    Todas las comisiones disponibles ya están vinculadas a este evento.
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setShowCommissionSelector(false)}
                className="px-8 py-3 bg-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-300 transition-all"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
