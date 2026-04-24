import React, { useState, useMemo, useRef } from 'react';
import { FileText, Calendar, CheckSquare, Download, ChevronDown, Filter, FileOutput, Settings } from 'lucide-react';
import { ProjectData, InterventoriaReport } from '../types';
import { useProject } from '../store/ProjectContext';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { showAlert } from '../utils/alert';
import { uploadDocumentToStorage, formatDateForInput } from '../lib/storage';
import { generateReportAIAnalysis } from '../services/geminiService';

interface GeneradorInformesProps {
  projects: ProjectData[];
  initialProjectId?: string;
}

export function GeneradorInformes({ projects, initialProjectId }: GeneradorInformesProps) {
  const { state, addDocument } = useProject();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [reportTargetType, setReportTargetType] = useState<'Proyecto' | 'Territorio' | 'Riesgo' | 'LineaInversion' | 'Contratista' | 'Fenomeno'>('Proyecto');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });
  const [reportType, setReportType] = useState<string>('Informe semanal');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [includeContractors, setIncludeContractors] = useState(false);
  const [includeOps, setIncludeOps] = useState(false);
  const [includeComisiones, setIncludeComisiones] = useState(false);
  const [includePolizas, setIncludePolizas] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const reportTypes = [
    'Informe semanal',
    'Informe mensual',
    'Informe consolidado',
    'Informe ejecutivo',
    'Informe territorial',
    'Control Fiscal',
    'Auditoría',
    'Costeo Integral de Respuesta'
  ];

  const selectedProject = useMemo(() => {
    return projects.find(p => p.project.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const availableReports = useMemo(() => {
    if (!selectedProject || !selectedProject.interventoriaReports) return [];
    let reports = [...selectedProject.interventoriaReports];
    
    if (dateRange.start) {
      reports = reports.filter(r => r.fechaFin >= dateRange.start);
    }
    if (dateRange.end) {
      reports = reports.filter(r => r.fechaInicio <= dateRange.end);
    }
    
    return reports.sort((a, b) => b.semana - a.semana);
  }, [selectedProject, dateRange]);

  const handleToggleReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAllReports = () => {
    if (selectedReports.length === availableReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(availableReports.map(r => r.id));
    }
  };

  const generateReport = async () => {
    if (reportTargetType === 'Proyecto' && !selectedProject) return;
    if (reportTargetType !== 'Proyecto' && !selectedEntityId) return;
    
    setIsGenerating(true);
    
    try {
      if (reportTargetType !== 'Proyecto') {
        // Generate aggregate report
        let filteredProjects = projects;
        let title = '';
        let contentSummary = '';

        if (reportTargetType === 'Territorio') {
          filteredProjects = projects.filter(p => p.project.departamento === selectedEntityId);
          title = `Informe Territorial - ${selectedEntityId}`;
          contentSummary = `Análisis consolidado de ${filteredProjects.length} proyectos en la región de ${selectedEntityId}.`;
        } else if (reportTargetType === 'LineaInversion') {
          filteredProjects = projects.filter(p => p.project.linea === selectedEntityId);
          title = `Informe Línea de Inversión - ${selectedEntityId}`;
          contentSummary = `Análisis consolidado de ${filteredProjects.length} proyectos en la línea de inversión ${selectedEntityId}.`;
        } else if (reportTargetType === 'Riesgo') {
          filteredProjects = projects.filter(p => p.alerts.some(a => a.nivel === selectedEntityId && a.estado === 'Abierta'));
          title = `Informe de Riesgos - Nivel ${selectedEntityId}`;
          contentSummary = `Análisis de ${filteredProjects.length} proyectos que presentan alertas activas de nivel ${selectedEntityId}.`;
        } else if (reportTargetType === 'Contratista') {
          const contratista = state.contratistas.find(c => c.id === selectedEntityId);
          filteredProjects = projects.filter(p => p.contracts.some(c => c.nit === contratista?.nit));
          title = `Informe de Contratista - ${contratista?.nombre}`;
          contentSummary = `Análisis de desempeño del contratista en ${filteredProjects.length} proyectos asignados.`;
        } else if (reportTargetType === 'Fenomeno') {
          // Filter projects that might be related to the phenomenon (for now, we'll just use all projects or a specific tag if available)
          // Since we don't have a direct "fenomeno" field, we can filter by some keyword in the name or just show all for the phenomenon
          filteredProjects = projects; 
          title = `Costeo Integral de Respuesta - Fenómeno: ${selectedEntityId}`;
          contentSummary = `Análisis de costeo integral de respuesta institucional para el fenómeno: ${selectedEntityId}. Incluye talento humano, operación, contratación y logística.`;
        }

        const totalPresupuesto = filteredProjects.reduce((sum, p) => sum + (p.presupuesto?.valorTotal || 0), 0);
        const avgFisico = filteredProjects.length > 0 
          ? filteredProjects.reduce((sum, p) => sum + p.project.avanceFisico, 0) / filteredProjects.length 
          : 0;
        const avgFinanciero = filteredProjects.length > 0 
          ? filteredProjects.reduce((sum, p) => sum + p.project.avanceFinanciero, 0) / filteredProjects.length 
          : 0;

        let costeoIntegral = null;
        if (reportTargetType === 'Fenomeno') {
          // 1. Costos de Talento Humano
          let costoTalentoHumano = 0;
          let horasTotales = 0;
          const profesionalesDetalle = state.professionals.map(prof => {
            const horas = (prof.horasReuniones || 0) + (prof.horasPMU || 0) + (prof.horasSeguimiento || 0) + (prof.horasCoordinacion || 0);
            const costo = horas * (prof.valorHora || 0);
            costoTalentoHumano += costo;
            horasTotales += horas;
            return {
              nombre: prof.nombre,
              cargo: prof.profesion,
              horas,
              costo
            };
          }).filter(p => p.horas > 0);

          // 2. Costos Operativos / Logísticos (Comisiones)
          const costoOperativo = filteredProjects.reduce((sum, p) => 
            sum + (p.comisiones?.reduce((cSum, c) => cSum + c.costoTotal, 0) || 0), 0
          );

          // 3. Costos Contractuales / Presupuestales (Contratos de Obra/Interventoría)
          const costoContractual = filteredProjects.reduce((sum, p) => 
            sum + (p.contracts?.reduce((cSum, c) => cSum + c.valor, 0) || 0), 0
          );

          // 4. Costos de Recursos Físicos (Estimado 5% del costo operativo para el ejemplo)
          const costoRecursosFisicos = costoOperativo * 0.05;

          // 5. Costos de Intervención Territorial (Ayudas, obras ejecutadas - Presupuesto Total)
          const costoIntervencionTerritorial = totalPresupuesto;

          const costoTotalRespuesta = costoTalentoHumano + costoOperativo + costoContractual + costoRecursosFisicos + costoIntervencionTerritorial;

          costeoIntegral = {
            costoTalentoHumano,
            horasTotales,
            profesionalesDetalle,
            costoOperativo,
            costoContractual,
            costoRecursosFisicos,
            costoIntervencionTerritorial,
            costoTotalRespuesta
          };
        }

        const reportData = {
          title,
          date: new Date().toLocaleDateString('es-CO'),
          isAggregate: true,
          reportTargetType,
          costeoIntegral,
          aggregateData: {
            projectCount: filteredProjects.length,
            totalPresupuesto,
            avgFisico,
            avgFinanciero,
            projects: filteredProjects.map(p => ({
              id: p.project.id,
              nombre: p.project.nombre,
              avanceFisico: p.project.avanceFisico,
              avanceFinanciero: p.project.avanceFinanciero,
              estado: p.project.estado
            }))
          },
          generalInfo: {
            contentSummary
          }
        };

        setGeneratedReport(reportData);
        setIsGenerating(false);
        return;
      }

      // Existing logic for single project
      const selectedReportsData = availableReports.filter(r => selectedReports.includes(r.id));
      
      // Calculate averages and trends based on selected reports
      const avgFisico = selectedReportsData.length > 0
        ? selectedReportsData.reduce((acc, r) => acc + r.obraEjecutadaPct, 0) / selectedReportsData.length
        : selectedProject.project.avanceFisico;
        
      const avgProgramado = selectedReportsData.length > 0
        ? selectedReportsData.reduce((acc, r) => acc + r.obraProgramadaPct, 0) / selectedReportsData.length
        : selectedProject.project.avanceProgramado;
        
      const desviacion = avgFisico - avgProgramado;
      const tendencia = desviacion >= 0 ? 'Positiva' : desviacion >= -5 ? 'Estable' : 'Negativa';

      const contratoObra = selectedProject.contracts.find(c => c.tipo === 'Obra');
      const contratoInterventoria = selectedProject.contracts.find(c => c.tipo === 'Interventoría');

      // 6 & 7. Actividades
      const actividadesEjecutadas = selectedReportsData.map(r => `Semana ${r.semana}:\n${r.actividadesEjecutadas}`).join('\n\n');
      const actividadesProgramadas = selectedReportsData.map(r => `Semana ${r.semana}:\n${r.actividadesProximas}`).join('\n\n');
      const observaciones = selectedReportsData.map(r => `Semana ${r.semana}:\n${r.observaciones}`).join('\n\n');

      // 8. Análisis Técnico
      let analisisTecnico = '';
      if (desviacion < -10) {
        analisisTecnico = 'Se evidencian retrasos críticos en la ejecución de la obra. El desempeño actual no garantiza el cumplimiento del cronograma. Existen inconsistencias significativas entre lo programado y lo ejecutado.';
      } else if (desviacion < 0) {
        analisisTecnico = 'Se presentan retrasos menores. El desempeño es aceptable pero requiere ajustes para alinearse con el cronograma. No se observan inconsistencias graves.';
      } else {
        analisisTecnico = 'El desempeño es óptimo, superando o cumpliendo el cronograma establecido. No se presentan retrasos ni inconsistencias.';
      }

      // New logic for specific report types
      let title = `${reportType} - ${selectedProject.project.nombre}`;
      let contentSummary = '';
      
      if (reportType === 'Control Fiscal') {
          title = `Informe de Control Fiscal - ${selectedProject.project.nombre}`;
          contentSummary = 'Este informe se enfoca en la ejecución presupuestal, cumplimiento de metas financieras y análisis de eficiencia en el uso de los recursos.';
      } else if (reportType === 'Auditoría') {
          title = `Informe de Auditoría Institucional - ${selectedProject.project.nombre}`;
          contentSummary = 'Este informe presenta una revisión integral del proyecto, incluyendo cumplimiento normativo, técnico, financiero y de interventoría, listo para procesos de auditoría.';
      }

      // Generate AI Analysis based on Territorial Knowledge
      let aiAnalysis = null;
      try {
        aiAnalysis = await generateReportAIAnalysis(selectedProject, state.conocimientoTerritorial);
      } catch (error) {
        console.error("Error generating AI analysis:", error);
      }

      // 10. Estado del Proyecto
      let estadoColor = '🟢';
      let estadoTexto = 'Normal';
      if (desviacion < -10 || selectedProject.alerts.some(a => a.nivel === 'Alto' && a.estado === 'Abierta')) {
        estadoColor = '🔴';
        estadoTexto = 'Crítico';
      } else if (desviacion < 0 || selectedProject.alerts.some(a => a.nivel === 'Medio' && a.estado === 'Abierta')) {
        estadoColor = '🟡';
        estadoTexto = 'En Riesgo';
      }

      // Análisis Inteligente
      const semanasCriticas = selectedReportsData.filter(r => (r.obraEjecutadaPct - r.obraProgramadaPct) < -5).map(r => r.semana);
      const alertasActivas = selectedProject.alerts.filter(a => a.estado === 'Abierta').map(a => `- [${a.nivel}] ${a.descripcion}`).join('\n');
      
      let conclusiones = '';
      if (estadoTexto === 'Crítico') {
        conclusiones = 'El proyecto requiere intervención inmediata por parte de la entidad contratante. Las desviaciones acumuladas comprometen la viabilidad del plazo contractual.';
      } else if (estadoTexto === 'En Riesgo') {
        conclusiones = 'Se requiere un plan de contingencia por parte del contratista para mitigar los riesgos identificados y recuperar el tiempo perdido.';
      } else {
        conclusiones = 'El proyecto avanza de acuerdo a lo planeado. Se recomienda mantener el ritmo de ejecución y el monitoreo constante.';
      }

      // Recomendaciones
      let recomendaciones = '';
      if (estadoTexto === 'Crítico') {
        recomendaciones = '1. Citar a comité extraordinario de obra.\n2. Exigir plan de choque al contratista.\n3. Evaluar posible proceso sancionatorio por incumplimiento.';
      } else if (estadoTexto === 'En Riesgo') {
        recomendaciones = '1. Solicitar reprogramación de actividades.\n2. Aumentar frentes de trabajo o personal.\n3. Realizar seguimiento semanal estricto a las actividades críticas.';
      } else {
        recomendaciones = '1. Continuar con el seguimiento regular.\n2. Mantener las buenas prácticas de ejecución.\n3. Prever posibles cuellos de botella futuros.';
      }

      // Acciones Correctivas
      const accionesCorrectivas = estadoTexto === 'Crítico' 
        ? '1. Requerimiento formal por incumplimiento.\n2. Activación de pólizas de cumplimiento si no hay mejora.\n3. Incremento de personal y maquinaria en sitio.'
        : estadoTexto === 'En Riesgo'
        ? '1. Ajuste al cronograma de obra.\n2. Aprobación de plan de contingencia.\n3. Mayor supervisión en frentes críticos.'
        : '1. Mantener el ritmo actual.\n2. Anticipar compra de materiales para evitar desabastecimiento.';

      // Riesgos Futuros
      const riesgosFuturos = estadoTexto === 'Crítico'
        ? 'Alta probabilidad de caducidad del contrato. Riesgo de sobrecostos por extensión de tiempo. Posible afectación a la comunidad por obras inconclusas.'
        : estadoTexto === 'En Riesgo'
        ? 'Posible incumplimiento del plazo final si no se corrigen las desviaciones. Riesgo de temporada invernal afectando frentes atrasados.'
        : 'Riesgos normales de ejecución. Posibles variaciones climáticas que afecten rendimientos específicos.';

      // Análisis Comparativo
      const analisisComparativo = selectedReportsData.length > 1 
        ? `Se analizaron ${selectedReportsData.length} periodos. El avance inicial fue de ${selectedReportsData[selectedReportsData.length - 1].obraEjecutadaPct}% y el final de ${selectedReportsData[0].obraEjecutadaPct}%, mostrando un progreso de ${(selectedReportsData[0].obraEjecutadaPct - selectedReportsData[selectedReportsData.length - 1].obraEjecutadaPct).toFixed(2)}% en el lapso evaluado.`
        : selectedReportsData.length === 1 
          ? 'Análisis correspondiente a un único periodo. No es posible establecer comparación histórica.'
          : 'No se seleccionaron informes semanales para realizar un análisis comparativo histórico.';

      // Desempeño Contratista
      const desempenoContratista = desviacion >= 0 
        ? 'Sobresaliente. El contratista demuestra capacidad técnica y operativa, cumpliendo a cabalidad con las obligaciones contractuales.'
        : desviacion >= -5
        ? 'Aceptable. El contratista cumple parcialmente, pero requiere mayor compromiso en la asignación de recursos para evitar mayores retrasos.'
        : 'Deficiente. El contratista no demuestra la capacidad operativa requerida. Se evidencian fallas en la planeación y ejecución de las actividades.';

      // Chart Data
      const chartData = [...selectedReportsData].reverse().map(r => ({
        name: `Sem ${r.semana}`,
        Ejecutado: r.obraEjecutadaPct,
        Programado: r.obraProgramadaPct
      }));

      // Fotografías
      const fotografias = selectedReportsData.flatMap(r => 
        (r.fotografias || []).map(foto => ({
          semana: r.semana,
          fecha: r.fechaInicio,
          url: foto.url,
          descripcion: foto.descripcion || `Avance semana ${r.semana}`
        }))
      );

      // Histórico de Avance
      const historicoAvance = selectedReportsData.map(r => ({
        semana: r.semana,
        fecha: `${r.fechaInicio} al ${r.fechaFin}`,
        programado: r.obraProgramadaPct,
        ejecutado: r.obraEjecutadaPct,
        desviacion: (r.obraEjecutadaPct - r.obraProgramadaPct).toFixed(2)
      }));

      // Alertas Detalladas
      const alertasDetalladas = selectedProject.alerts.map(a => ({
        fecha: a.fecha,
        nivel: a.nivel,
        descripcion: a.descripcion,
        estado: a.estado
      }));

      // Seguimientos (Avances)
      const seguimientos = selectedProject.avances.map(t => ({
        fecha: t.fecha,
        reporta: 'Sistema',
        observaciones: t.observaciones
      }));

      // Permisos Ambientales
      const ambientales = selectedProject.environmental.map(e => ({
        permiso: e.permiso,
        resolucion: e.resolucion,
        estado: e.estado,
        compensaciones: e.compensaciones
      }));

      // SISO Ambiental de los informes
      const sisoAmbiental = selectedReportsData.map(r => `Semana ${r.semana}:\n${r.sisoAmbiental || 'Sin reporte'}`).join('\n\n');

      // Contratos Detallados
      const contratosDetallados = selectedProject.contracts.map(c => ({
        tipo: c.tipo,
        contratista: c.contratista,
        nit: c.nit,
        valor: c.valor,
        plazo: c.plazoMeses
      }));

      // OPS & Comisiones Data
      const opsData = selectedProject.ops || [];
      const comisionesData = selectedProject.comisiones || [];
      const polizasData = selectedProject.polizas || [];

      // Calculate OPS Metrics
      const totalOpsCost = opsData.reduce((sum, ops) => sum + ops.honorariosMensuales, 0);
      const opsPerformance = opsData.length > 0
        ? opsData.reduce((sum, ops) => {
            const prof = state.professionals.find(p => p.id === ops.id); // Assuming ID match
            return sum + (prof?.desempeño || 0);
          }, 0) / opsData.length
        : 0;

      // Calculate Commission Metrics
      const totalComisionesCost = comisionesData.reduce((sum, c) => sum + c.costoTotal, 0);
      const comisionesVisitas = comisionesData.length;
      const resultadosCampo = comisionesData.map(c => c.informe?.hallazgos || 'Sin hallazgos').join('; ');

      // Contractor Rigor Data
      let contractorRigor = null;
      if (includeContractors) {
        const mainContractor = selectedProject.contracts.find(c => c.tipo === 'Obra');
        if (mainContractor) {
          const contractor = state.contratistas.find(c => c.nit === mainContractor.nit);
          if (contractor) {
            const evals = state.evaluacionesContratistas.filter(e => e.contractorId === contractor.id);
            const avgEval = evals.length > 0 
              ? evals.reduce((sum, e) => sum + (e.calificacionCalidad + e.calificacionCumplimiento + e.calificacionSST + e.calificacionAmbiental) / 4, 0) / evals.length 
              : 0;
            
            contractorRigor = {
              nombre: contractor.nombre,
              nit: contractor.nit,
              tipo: contractor.tipo,
              evaluaciones: evals,
              promedio: avgEval.toFixed(2),
              desempeno: avgEval >= 4.5 ? 'Excelente' : avgEval >= 3.5 ? 'Bueno' : avgEval >= 2.5 ? 'Regular' : 'Deficiente'
            };
          }
        }
      }

      const reportData = {
        title: title,
        date: new Date().toLocaleDateString('es-CO'),
        includeContractors,
        includeOps,
        includeComisiones,
        includePolizas,
        contractorRigor,
        polizasData,
        matrixData: selectedProject.project.matrix,
        generalInfo: {
          nombre: selectedProject.project.nombre,
          ubicacion: `${selectedProject.project.municipio}, ${selectedProject.project.departamento}`,
          contratista: contratoObra?.contratista || 'No asignado',
          interventoria: contratoInterventoria?.contratista || 'No asignado',
          valorTotal: selectedProject.presupuesto.valorTotal,
          fechaInicio: selectedProject.project.fechaInicio,
          fechaFin: selectedProject.project.fechaFin,
        },
        objetoContrato: contratoObra?.objetoContractual || 'No especificado',
        resumenEjecutivo: {
          estado: selectedProject.project.estado,
          alertasActivas: selectedProject.alerts.filter(a => a.estado === 'Abierta').length,
          sintesis: contentSummary || `El proyecto se encuentra en estado "${selectedProject.project.estado}" con un avance físico del ${selectedProject.project.avanceFisico}%. Actualmente presenta ${selectedProject.alerts.filter(a => a.estado === 'Abierta').length} alertas activas que requieren atención.`,
        },
        avanceFisico: {
          promedio: avgFisico.toFixed(2),
          tendencia: tendencia,
          desviacion: desviacion.toFixed(2),
        },
        avanceFinanciero: {
          ejecutado: selectedProject.presupuesto.pagosRealizados,
          programado: selectedProject.presupuesto.valorTotal * (avgProgramado / 100),
          porcentajeEjecutado: ((selectedProject.presupuesto.pagosRealizados / selectedProject.presupuesto.valorTotal) * 100).toFixed(2),
        },
        comisionesData: comisionesData,
        comisionesMetrics: {
          totalCost: totalComisionesCost,
          visitCount: comisionesVisitas,
          fieldResults: resultadosCampo
        },
        actividadesEjecutadas,
        actividadesProgramadas,
        analisisTecnico,
        observaciones,
        estadoProyecto: {
          color: estadoColor,
          texto: estadoTexto
        },
        analisisInteligente: {
          tendencia,
          semanasCriticas: semanasCriticas.length > 0 ? semanasCriticas.join(', ') : 'Ninguna',
          desviacionAcumulada: desviacion.toFixed(2),
          alertas: alertasActivas || 'No hay alertas activas.',
          conclusiones,
          accionesCorrectivas,
          riesgosFuturos,
          analisisComparativo,
          desempenoContratista
        },
        recomendaciones,
        chartData,
        fotografias,
        historicoAvance,
        alertasDetalladas,
        contratosDetallados,
        seguimientos,
        ambientales,
        sisoAmbiental,
        opsMetrics: {
          totalCost: totalOpsCost,
          performance: opsPerformance.toFixed(2),
          count: opsData.length
        },
        aiAnalysis
      };
      
      setGeneratedReport(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      showAlert("Error al generar el informe");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleUploadReport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) return;

    try {
      const folderPath = `Informes/${selectedProject.project.nombre}`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);

      // Save to repository
      addDocument({
        id: `DOC-${Date.now()}`,
        projectId: selectedProject.project.id,
        titulo: file.name,
        tipo: 'Informe',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        tags: ['Informe', 'Externo'],
        estado: 'Borrador',
        versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: publicUrl,
            nombreArchivo: file.name,
            subidoPor: 'Usuario',
            accion: 'Subida',
            estado: 'Borrador'
        }]
      });
      showAlert(`Informe "${file.name}" cargado y guardado en el repositorio.`);
    } catch (error) {
      console.error("Error uploading report:", error);
      showAlert("Hubo un error al subir el informe.");
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !generatedReport) return;
    
    setIsExporting(true);
    try {
      const imgData = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (img.height * pdfWidth) / img.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Add page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Página ${i} de ${pageCount}`, pdfWidth - 20, pdfHeight - 10, { align: 'right' });
      }
      
      const pdfBlob = pdf.output('blob');
      const fileName = `${generatedReport.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const folderPath = `Proyectos/${selectedProject.project.id}/Informes`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);
      
      // Save to repository
      addDocument({
        id: `DOC-${Date.now()}`,
        projectId: selectedProject.project.id,
        titulo: fileName,
        tipo: 'Informe',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        tags: ['Informe', 'PDF'],
        estado: 'Borrador',
        folderPath,
        versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: publicUrl,
            nombreArchivo: fileName,
            subidoPor: 'Sistema',
            accion: 'Subida',
            estado: 'Borrador'
        }]
      });

      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showAlert('Hubo un error al exportar el PDF. Por favor, intente de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <FileOutput size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Generador de Informes Institucionales</h1>
        </div>
        <p className="text-slate-500">Configure y genere informes consolidados a partir de los datos de interventoría.</p>
        
        <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-2">Cargar Informe Externo</h3>
          <input 
            type="file" 
            accept=".pdf,.txt" 
            onChange={handleUploadReport}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuración del Informe */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-slate-400" />
                Parámetros del Informe
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alcance del Informe</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={reportTargetType}
                    onChange={(e) => {
                      setReportTargetType(e.target.value as any);
                      setSelectedProjectId('');
                      setSelectedEntityId('');
                      setSelectedReports([]);
                      setGeneratedReport(null);
                    }}
                  >
                    <option value="Proyecto">Proyecto Específico</option>
                    <option value="Territorio">Territorio / Región</option>
                    <option value="LineaInversion">Línea de Inversión</option>
                    <option value="Riesgo">Gestión de Riesgos</option>
                    <option value="Contratista">Desempeño de Contratista</option>
                    <option value="Fenomeno">Respuesta a Fenómenos</option>
                  </select>
                </div>

                {reportTargetType === 'Proyecto' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Proyecto</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedReports([]);
                        setGeneratedReport(null);
                      }}
                    >
                      <option value="">Seleccione un proyecto...</option>
                      {projects.map(p => (
                        <option key={p.project.id} value={p.project.id}>{p.project.id} - {p.project.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportTargetType === 'Territorio' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Territorio</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={selectedEntityId}
                      onChange={(e) => {
                        setSelectedEntityId(e.target.value);
                        setGeneratedReport(null);
                      }}
                    >
                      <option value="">Seleccione un territorio...</option>
                      {Array.from(new Set(projects.map(p => p.project.departamento).filter(Boolean))).map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportTargetType === 'LineaInversion' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Línea de Inversión</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={selectedEntityId}
                      onChange={(e) => {
                        setSelectedEntityId(e.target.value);
                        setGeneratedReport(null);
                      }}
                    >
                      <option value="">Seleccione una línea de inversión...</option>
                      {Array.from(new Set(projects.map(p => p.project.linea).filter(Boolean))).map(linea => (
                        <option key={linea} value={linea}>{linea}</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportTargetType === 'Riesgo' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Riesgo</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={selectedEntityId}
                      onChange={(e) => {
                        setSelectedEntityId(e.target.value);
                        setGeneratedReport(null);
                      }}
                    >
                      <option value="">Seleccione un nivel de riesgo...</option>
                      <option value="Alto">Alto</option>
                      <option value="Medio">Medio</option>
                      <option value="Bajo">Bajo</option>
                    </select>
                  </div>
                )}

                {reportTargetType === 'Contratista' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contratista</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={selectedEntityId}
                      onChange={(e) => {
                        setSelectedEntityId(e.target.value);
                        setGeneratedReport(null);
                      }}
                    >
                      <option value="">Seleccione un contratista...</option>
                      {state.contratistas.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit})</option>
                      ))}
                    </select>
                  </div>
                )}

                {reportTargetType === 'Fenomeno' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fenómeno</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={selectedEntityId}
                      onChange={(e) => {
                        setSelectedEntityId(e.target.value);
                        setGeneratedReport(null);
                      }}
                    >
                      <option value="">Seleccione un fenómeno...</option>
                      <option value="Frente Frío">Frente Frío</option>
                      <option value="La Niña">La Niña</option>
                      <option value="El Niño">El Niño</option>
                      <option value="Sismo">Sismo</option>
                      <option value="Huracán">Huracán</option>
                      <option value="Inundación">Inundación</option>
                      <option value="Deslizamiento">Deslizamiento</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Informe</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {reportTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={formatDateForInput(dateRange.start)}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                    <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={formatDateForInput(dateRange.end)}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${includeContractors ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={includeContractors}
                        onChange={() => setIncludeContractors(!includeContractors)}
                      />
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includeContractors ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Incluir Rigor de Contratistas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${includeOps ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={includeOps}
                        onChange={() => setIncludeOps(!includeOps)}
                      />
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includeOps ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Incluir Datos OPS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${includeComisiones ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={includeComisiones}
                        onChange={() => setIncludeComisiones(!includeComisiones)}
                      />
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includeComisiones ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Incluir Comisiones</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1 ml-12">Agrega análisis de desempeño y evaluaciones históricas del contratista.</p>
                </div>

                <div className="group">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative w-10 h-5 bg-slate-200 rounded-full transition-colors group-hover:bg-slate-300">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={includePolizas}
                        onChange={() => setIncludePolizas(!includePolizas)}
                      />
                      <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includePolizas ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Incluir Pólizas y Garantías</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1 ml-12">Detalle de coberturas, vigencias y estados de las garantías contractuales.</p>
                </div>
              </div>
            </div>

            {reportTargetType === 'Proyecto' && selectedProject && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    Informes Base
                  </h2>
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {availableReports.length} disponibles
                  </span>
                </div>

                {availableReports.length > 0 ? (
                  <>
                    <div className="mb-3 flex justify-between items-center">
                      <button 
                        onClick={handleSelectAllReports}
                        className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                      >
                        {selectedReports.length === availableReports.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                      <span className="text-xs text-slate-500">{selectedReports.length} seleccionados</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {availableReports.map(report => (
                        <label key={report.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={selectedReports.includes(report.id)}
                            onChange={() => handleToggleReport(report.id)}
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-800">Semana {report.semana}</div>
                            <div className="text-xs text-slate-500">{report.fechaInicio} al {report.fechaFin}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600 font-medium">No hay informes semanales disponibles.</p>
                    <p className="text-xs text-slate-500 mt-1">Aún así, puedes generar el documento base con la información general y la matriz oficial del proyecto.</p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={(reportTargetType === 'Proyecto' && !selectedProject) || (reportTargetType !== 'Proyecto' && !selectedEntityId) || isGenerating}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Generar Documento
                </>
              )}
            </button>
          </div>

          {/* Vista Previa del Informe */}
          <div className="lg:col-span-2">
            {generatedReport ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <CheckSquare size={18} className="text-emerald-500" />
                    Vista Previa del Documento
                  </h3>
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {isExporting ? 'Exportando...' : 'Exportar PDF'}
                  </button>
                </div>
                
                <div className="p-8 overflow-y-auto flex-1 bg-slate-100/50">
                  <div ref={reportRef} className="bg-white p-10 shadow-sm border border-slate-200 max-w-3xl mx-auto font-serif">
                    {generatedReport.isAggregate ? (
                      // Aggregate Report Render
                      <div className="space-y-8 text-sm">
                        <div className="text-center border-b-2 border-indigo-600 pb-6 mb-8">
                          <h1 className="text-3xl font-bold text-slate-900 mb-2">{generatedReport.title}</h1>
                          <div className="mt-4 space-y-2 text-slate-600">
                            <p className="font-medium">Fecha de Generación:</p>
                            <p>{generatedReport.date}</p>
                          </div>
                        </div>

                        <section className="mb-8">
                          <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">1. Resumen Ejecutivo</h2>
                          <p className="text-slate-700 whitespace-pre-line">{generatedReport.generalInfo.contentSummary}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                              <div className="text-xs text-indigo-600 font-semibold uppercase mb-1">Total Proyectos</div>
                              <div className="text-2xl font-bold text-indigo-900">{generatedReport.aggregateData.projectCount}</div>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                              <div className="text-xs text-emerald-600 font-semibold uppercase mb-1">Presupuesto Total</div>
                              <div className="text-xl font-bold text-emerald-900">{formatCurrency(generatedReport.aggregateData.totalPresupuesto)}</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                              <div className="text-xs text-blue-600 font-semibold uppercase mb-1">Avance Físico Promedio</div>
                              <div className="text-2xl font-bold text-blue-900">{generatedReport.aggregateData.avgFisico.toFixed(2)}%</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                              <div className="text-xs text-purple-600 font-semibold uppercase mb-1">Avance Financiero Promedio</div>
                              <div className="text-2xl font-bold text-purple-900">{generatedReport.aggregateData.avgFinanciero.toFixed(2)}%</div>
                            </div>
                          </div>
                        </section>

                        {generatedReport.reportTargetType === 'Fenomeno' && generatedReport.costeoIntegral && (
                          <section className="mb-8">
                            <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">2. Costeo Integral de Respuesta</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">Resumen de Costos</h3>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">1. Talento Humano:</span>
                                    <span className="font-semibold">{formatCurrency(generatedReport.costeoIntegral.costoTalentoHumano)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">2. Operativos / Logísticos:</span>
                                    <span className="font-semibold">{formatCurrency(generatedReport.costeoIntegral.costoOperativo)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">3. Contractuales:</span>
                                    <span className="font-semibold">{formatCurrency(generatedReport.costeoIntegral.costoContractual)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">4. Recursos Físicos (Est.):</span>
                                    <span className="font-semibold">{formatCurrency(generatedReport.costeoIntegral.costoRecursosFisicos)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">5. Intervención Territorial:</span>
                                    <span className="font-semibold">{formatCurrency(generatedReport.costeoIntegral.costoIntervencionTerritorial)}</span>
                                  </div>
                                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Costo Total Institucional:</span>
                                    <span className="font-black text-indigo-700 text-lg">{formatCurrency(generatedReport.costeoIntegral.costoTotalRespuesta)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase">Detalle Talento Humano</h3>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                                      {generatedReport.costeoIntegral.profesionalesDetalle.length}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">Profesionales Involucrados</p>
                                      <p className="text-xs text-slate-500">{generatedReport.costeoIntegral.horasTotales} horas totales dedicadas</p>
                                    </div>
                                  </div>
                                  
                                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {generatedReport.costeoIntegral.profesionalesDetalle.map((prof: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center p-2 bg-white rounded border border-slate-100 text-xs">
                                        <div>
                                          <p className="font-semibold text-slate-700">{prof.nombre}</p>
                                          <p className="text-slate-500">{prof.cargo}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium text-slate-800">{prof.horas}h</p>
                                          <p className="text-slate-500">{formatCurrency(prof.costo)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        )}

                        <section className="mb-8">
                          <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">
                            {generatedReport.reportTargetType === 'Fenomeno' ? '3. Listado de Proyectos' : '2. Listado de Proyectos'}
                          </h2>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 text-xs uppercase">
                                  <th className="p-3 border-b border-slate-200">ID</th>
                                  <th className="p-3 border-b border-slate-200">Nombre</th>
                                  <th className="p-3 border-b border-slate-200">Estado</th>
                                  <th className="p-3 border-b border-slate-200 text-right">Avance Físico</th>
                                  <th className="p-3 border-b border-slate-200 text-right">Avance Financiero</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm">
                                {generatedReport.aggregateData.projects.map((p: any) => (
                                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 font-mono text-xs text-slate-500">{p.id}</td>
                                    <td className="p-3 font-medium text-slate-800">{p.nombre}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        p.estado === 'En Ejecución' ? 'bg-emerald-100 text-emerald-800' :
                                        p.estado === 'Suspendido' ? 'bg-amber-100 text-amber-800' :
                                        p.estado === 'Liquidado' ? 'bg-slate-100 text-slate-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {p.estado}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-medium">{p.avanceFisico.toFixed(2)}%</td>
                                    <td className="p-3 text-right font-medium">{p.avanceFinanciero.toFixed(2)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      </div>
                    ) : (
                      // Single Project Report Render
                      <>
                        {/* Portada */}
                        <div className="flex flex-col items-center justify-center min-h-[800px] border-b-2 border-slate-800 pb-12 mb-12 text-center" style={{ pageBreakAfter: 'always' }}>
                      <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-8">
                        <FileText size={48} className="text-slate-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-slate-600 tracking-widest uppercase mb-4">Sistema de Seguimiento SRR</h2>
                      <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-wide mb-8 leading-tight max-w-2xl">
                        {generatedReport.title}
                      </h1>
                      <div className="w-16 h-1 bg-indigo-600 mb-8"></div>
                      <div className="space-y-2 text-lg text-slate-700">
                        <p className="font-semibold">{generatedReport.generalInfo.nombre}</p>
                        <p>{generatedReport.generalInfo.ubicacion}</p>
                      </div>
                      <div className="mt-auto pt-24 space-y-2 text-slate-600">
                        <p className="font-medium">Fecha de Generación:</p>
                        <p>{generatedReport.date}</p>
                      </div>
                    </div>

                    {/* 1. Información General */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">1. Información General del Proyecto</h2>
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div className="font-semibold text-slate-700">Nombre del Proyecto:</div>
                        <div className="text-slate-900">{generatedReport.generalInfo.nombre}</div>
                        
                        <div className="font-semibold text-slate-700">Ubicación:</div>
                        <div className="text-slate-900">{generatedReport.generalInfo.ubicacion}</div>
                        
                        <div className="font-semibold text-slate-700">Contratista de Obra:</div>
                        <div className="text-slate-900">{generatedReport.generalInfo.contratista}</div>
                        
                        <div className="font-semibold text-slate-700">Interventoría:</div>
                        <div className="text-slate-900">{generatedReport.generalInfo.interventoria}</div>
                        
                        <div className="font-semibold text-slate-700">Valor Total:</div>
                        <div className="text-slate-900">{formatCurrency(generatedReport.generalInfo.valorTotal)}</div>
                        
                        <div className="font-semibold text-slate-700">Plazo de Ejecución:</div>
                        <div className="text-slate-900">{generatedReport.generalInfo.fechaInicio} al {generatedReport.generalInfo.fechaFin}</div>
                      </div>
                    </section>

                    {/* 1.1 Ficha Técnica (Matriz Oficial) */}
                    {generatedReport.matrixData && (
                      <section className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">1.1 Ficha Técnica (Matriz Oficial)</h2>
                        
                        <div className="space-y-6">
                          {/* General */}
                          <div>
                            <h3 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 p-2 rounded">Datos Generales</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div className="font-semibold text-slate-600">BPIN:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.bpin || 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Sector:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.sector || 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Subregión:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.subregion || 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Estado Actual:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.estadoActual || 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Fecha Aprobación:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.fechaAprobacion || 'N/A'}</div>
                            </div>
                          </div>

                          {/* Financiero */}
                          <div>
                            <h3 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 p-2 rounded">Información Financiera</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div className="font-semibold text-slate-600">Valor Total Proyecto:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.valorTotalProyecto ? formatCurrency(generatedReport.matrixData.valorTotalProyecto) : 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Aporte FNGRD:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.aporteFngrdObraInterventoria ? formatCurrency(generatedReport.matrixData.aporteFngrdObraInterventoria) : 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Aporte Municipio/Gobernación:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.aporteMunicipioGobernacionObraInterventoria ? formatCurrency(generatedReport.matrixData.aporteMunicipioGobernacionObraInterventoria) : 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Saldo por Pagar:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.saldoPorPagar ? formatCurrency(generatedReport.matrixData.saldoPorPagar) : 'N/A'}</div>
                            </div>
                          </div>

                          {/* Convenio */}
                          {generatedReport.matrixData.numeroConvenio && (
                            <div>
                              <h3 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 p-2 rounded">Datos del Convenio</h3>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div className="font-semibold text-slate-600">Número:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroConvenio}</div>
                                
                                <div className="font-semibold text-slate-600">Partes:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.partesConvenio || 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Plazo Inicial:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.plazoInicialMesesConvenio ? `${generatedReport.matrixData.plazoInicialMesesConvenio} meses` : 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Acta de Inicio:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.actaInicioConvenio || 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Fecha Finalización:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.fechaFinalizacionConvenio || 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Valor Pagado:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.valorPagadoConvenio ? formatCurrency(generatedReport.matrixData.valorPagadoConvenio) : 'N/A'}</div>

                                <div className="font-semibold text-slate-600">Afectación Presupuestal:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.afectacionPresupuestal || 'N/A'}</div>

                                <div className="font-semibold text-slate-600">CDP Convenio:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroCdpConvenio || 'N/A'} ({generatedReport.matrixData.fechaCdpConvenio || 'N/A'})</div>

                                <div className="font-semibold text-slate-600">RC Convenio:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroRcConvenio || 'N/A'} ({generatedReport.matrixData.fechaRcConvenio || 'N/A'})</div>
                              </div>
                            </div>
                          )}

                          {/* Obra */}
                          {generatedReport.matrixData.numeroContratoObra && (
                            <div>
                              <h3 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 p-2 rounded">Contrato de Obra</h3>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div className="font-semibold text-slate-600">Número:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroContratoObra}</div>
                                
                                <div className="font-semibold text-slate-600">Contratista:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.contratistaObra || 'N/A'} (NIT: {generatedReport.matrixData.nitContratistaObra || 'N/A'})</div>
                                
                                <div className="font-semibold text-slate-600">Valor Contrato:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.valorContratoObra ? formatCurrency(generatedReport.matrixData.valorContratoObra) : 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Valor Pagado:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.valorPagadoObra ? formatCurrency(generatedReport.matrixData.valorPagadoObra) : 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Fecha Inicio:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.fechaInicioObra || 'N/A'}</div>

                                <div className="font-semibold text-slate-600">CDP Obra:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroCdpObra || 'N/A'} ({generatedReport.matrixData.fechaCdpObra || 'N/A'})</div>

                                <div className="font-semibold text-slate-600">RC Obra:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroRcObra || 'N/A'} ({generatedReport.matrixData.fechaRcObra || 'N/A'})</div>
                              </div>
                            </div>
                          )}

                          {/* Interventoría */}
                          {generatedReport.matrixData.numeroContratoInterventoria && (
                            <div>
                              <h3 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 p-2 rounded">Contrato de Interventoría</h3>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div className="font-semibold text-slate-600">Número:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroContratoInterventoria}</div>
                                
                                <div className="font-semibold text-slate-600">Contratista:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.contratistaInterventoria || 'N/A'} (NIT: {generatedReport.matrixData.nitContratistaInterventoria || 'N/A'})</div>
                                
                                <div className="font-semibold text-slate-600">Valor Contrato:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.valorContratoInterventoria ? formatCurrency(generatedReport.matrixData.valorContratoInterventoria) : 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Valor Pagado:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.valorPagadoInterventoria ? formatCurrency(generatedReport.matrixData.valorPagadoInterventoria) : 'N/A'}</div>
                                
                                <div className="font-semibold text-slate-600">Fecha Suscripción:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.fechaSuscripcionInterventoria || 'N/A'}</div>

                                <div className="font-semibold text-slate-600">CDP Interventoría:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroCdpInterventoria || 'N/A'} ({generatedReport.matrixData.fechaCdpInterventoria || 'N/A'})</div>

                                <div className="font-semibold text-slate-600">RC Interventoría:</div>
                                <div className="text-slate-900">{generatedReport.matrixData.numeroRcInterventoria || 'N/A'} ({generatedReport.matrixData.fechaRcInterventoria || 'N/A'})</div>
                              </div>
                            </div>
                          )}

                          {/* Equipo Asignado */}
                          <div>
                            <h3 className="text-sm font-bold text-indigo-900 mb-3 bg-indigo-50 p-2 rounded">Equipo Asignado (Apoyos)</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                              <div className="font-semibold text-slate-600">Apoyo Técnico:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.apoyoTecnico || generatedReport.matrixData.apoyoTecnico2026 || generatedReport.matrixData.apoyoTecnicoAntigüo || 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Apoyo Financiero:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.apoyoFinanciero || 'N/A'}</div>
                              
                              <div className="font-semibold text-slate-600">Apoyo Jurídico:</div>
                              <div className="text-slate-900">{generatedReport.matrixData.apoyoJuridico || generatedReport.matrixData.apoyoJuridico2026 || 'N/A'}</div>
                            </div>
                          </div>

                        </div>
                      </section>
                    )}

                    {/* 2. Objeto del Contrato */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">2. Objeto del Contrato</h2>
                      <p className="text-sm text-slate-800 leading-relaxed text-justify mb-4">
                        {generatedReport.objetoContrato}
                      </p>
                      
                      <h3 className="text-md font-semibold text-slate-700 mb-2">Detalle de Contratos Asociados</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="border border-slate-300 px-3 py-2">Tipo</th>
                              <th className="border border-slate-300 px-3 py-2">Contratista</th>
                              <th className="border border-slate-300 px-3 py-2">NIT</th>
                              <th className="border border-slate-300 px-3 py-2">Valor</th>
                              <th className="border border-slate-300 px-3 py-2">Plazo (Meses)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedReport.contratosDetallados.map((c: any, idx: number) => (
                              <tr key={idx} className="bg-white">
                                <td className="border border-slate-300 px-3 py-2 font-medium">{c.tipo}</td>
                                <td className="border border-slate-300 px-3 py-2">{c.contratista}</td>
                                <td className="border border-slate-300 px-3 py-2">{c.nit}</td>
                                <td className="border border-slate-300 px-3 py-2">{formatCurrency(c.valor)}</td>
                                <td className="border border-slate-300 px-3 py-2 text-center">{c.plazo}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* 2.1 Rigor de Contratistas (Optional) */}
                    {generatedReport.includeContractors && generatedReport.contractorRigor && (
                      <section className="mb-8 p-6 bg-slate-50 border-2 border-indigo-100 rounded-xl">
                        <h2 className="text-lg font-bold text-indigo-900 uppercase border-b border-indigo-200 pb-2 mb-4">Análisis de Rigor del Contratista</h2>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Contratista Evaluado</p>
                            <p className="text-sm font-bold text-slate-900">{generatedReport.contractorRigor.nombre}</p>
                            <p className="text-xs text-slate-600">NIT: {generatedReport.contractorRigor.nit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Calificación Promedio</p>
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-lg font-black ${
                                Number(generatedReport.contractorRigor.promedio) >= 4 ? 'text-emerald-600' : 
                                Number(generatedReport.contractorRigor.promedio) >= 3 ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {generatedReport.contractorRigor.promedio} / 5.0
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600">
                                {generatedReport.contractorRigor.desempeno}
                              </span>
                            </div>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-700 mb-3">Historial de Evaluaciones de Desempeño</h3>
                        <div className="space-y-3">
                          {generatedReport.contractorRigor.evaluaciones.length > 0 ? (
                            generatedReport.contractorRigor.evaluaciones.map((e: any) => (
                              <div key={e.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-indigo-600">{e.periodo}</span>
                                  <span className="text-[10px] text-slate-400">{e.fecha}</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                  <div className="text-center p-1 bg-slate-50 rounded">
                                    <p className="text-[8px] uppercase text-slate-400 font-bold">Calidad</p>
                                    <p className="text-xs font-bold">{e.calificacionCalidad}</p>
                                  </div>
                                  <div className="text-center p-1 bg-slate-50 rounded">
                                    <p className="text-[8px] uppercase text-slate-400 font-bold">Cumplimiento</p>
                                    <p className="text-xs font-bold">{e.calificacionCumplimiento}</p>
                                  </div>
                                  <div className="text-center p-1 bg-slate-50 rounded">
                                    <p className="text-[8px] uppercase text-slate-400 font-bold">SST</p>
                                    <p className="text-xs font-bold">{e.calificacionSST}</p>
                                  </div>
                                  <div className="text-center p-1 bg-slate-50 rounded">
                                    <p className="text-[8px] uppercase text-slate-400 font-bold">Ambiental</p>
                                    <p className="text-xs font-bold">{e.calificacionAmbiental}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 italic">"{e.observaciones}"</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded-lg border border-dashed border-slate-200">
                              No se registran evaluaciones de rigor para este periodo.
                            </p>
                          )}
                        </div>
                      </section>
                    )}

                    {/* 3. Resumen Ejecutivo */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">3. Resumen Ejecutivo</h2>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 leading-relaxed text-justify">
                        {generatedReport.resumenEjecutivo.sintesis}
                      </div>
                    </section>

                    {/* 4. Avance Físico */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">4. Avance Físico y Cronograma</h2>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Promedio Avance</div>
                          <div className="text-2xl font-bold text-slate-800">{generatedReport.avanceFisico.promedio}%</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tendencia</div>
                          <div className={`text-xl font-bold ${
                            generatedReport.avanceFisico.tendencia === 'Positiva' ? 'text-emerald-600' : 
                            generatedReport.avanceFisico.tendencia === 'Negativa' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {generatedReport.avanceFisico.tendencia}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Desviación</div>
                          <div className={`text-xl font-bold ${Number(generatedReport.avanceFisico.desviacion) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {Number(generatedReport.avanceFisico.desviacion) > 0 ? '+' : ''}{generatedReport.avanceFisico.desviacion}%
                          </div>
                        </div>
                      </div>

                      <h3 className="text-md font-semibold text-slate-700 mb-2">Histórico de Avance por Periodo</h3>
                      {generatedReport.historicoAvance.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="border border-slate-300 px-3 py-2 text-center">Semana</th>
                                <th className="border border-slate-300 px-3 py-2">Periodo</th>
                                <th className="border border-slate-300 px-3 py-2 text-center">Programado (%)</th>
                                <th className="border border-slate-300 px-3 py-2 text-center">Ejecutado (%)</th>
                                <th className="border border-slate-300 px-3 py-2 text-center">Desviación (%)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.historicoAvance.map((h: any, idx: number) => (
                                <tr key={idx} className="bg-white">
                                  <td className="border border-slate-300 px-3 py-2 text-center font-medium">{h.semana}</td>
                                  <td className="border border-slate-300 px-3 py-2">{h.fecha}</td>
                                  <td className="border border-slate-300 px-3 py-2 text-center">{h.programado}%</td>
                                  <td className="border border-slate-300 px-3 py-2 text-center">{h.ejecutado}%</td>
                                  <td className={`border border-slate-300 px-3 py-2 text-center font-medium ${Number(h.desviacion) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {Number(h.desviacion) > 0 ? '+' : ''}{h.desviacion}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-200">No se seleccionaron informes semanales para mostrar el histórico.</p>
                      )}
                    </section>

                    {/* 5. Avance Financiero */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">5. Avance Financiero</h2>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700">Valor Ejecutado (Pagos Realizados):</span>
                          <span className="font-bold text-slate-900">{formatCurrency(generatedReport.avanceFinanciero.ejecutado)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="font-semibold text-slate-700">Valor Programado (Proyectado):</span>
                          <span className="font-bold text-slate-900">{formatCurrency(generatedReport.avanceFinanciero.programado)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded border border-indigo-100">
                          <span className="font-semibold text-indigo-900">Porcentaje de Ejecución Financiera:</span>
                          <span className="font-bold text-indigo-700 text-lg">{generatedReport.avanceFinanciero.porcentajeEjecutado}%</span>
                        </div>
                      </div>
                    </section>

                    {/* 6. Pólizas y Garantías */}
                    {generatedReport.includePolizas && generatedReport.polizasData && generatedReport.polizasData.length > 0 && (
                      <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">6. Pólizas y Garantías</h2>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="border border-slate-300 px-2 py-1.5">No. Póliza</th>
                                <th className="border border-slate-300 px-2 py-1.5">Tipo de Amparo</th>
                                <th className="border border-slate-300 px-2 py-1.5">Aseguradora</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-right">Valor Asegurado</th>
                                <th className="border border-slate-300 px-2 py-1.5">Vigencia Hasta</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center">Estado</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center">Cobertura</th>
                                <th className="border border-slate-300 px-2 py-1.5">Apoyo / Supervisión</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.polizasData.map((p: any, idx: number) => (
                                <tr key={idx} className="bg-white">
                                  <td className="border border-slate-300 px-2 py-1.5 font-medium">{p.numero_poliza}</td>
                                  <td className="border border-slate-300 px-2 py-1.5">{p.tipo_amparo}</td>
                                  <td className="border border-slate-300 px-2 py-1.5">{p.entidad_aseguradora}</td>
                                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{formatCurrency(p.valor_asegurado)}</td>
                                  <td className="border border-slate-300 px-2 py-1.5">{p.fecha_finalizacion_vigencia}</td>
                                  <td className="border border-slate-300 px-2 py-1.5 text-center">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      p.estado === 'VIGENTE' ? 'bg-emerald-100 text-emerald-800' :
                                      p.estado === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                                      p.estado === 'POR VENCER' ? 'bg-amber-100 text-amber-800' :
                                      'bg-slate-100 text-slate-800'
                                    }`}>
                                      {p.estado}
                                    </span>
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1.5 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`text-[10px] font-bold ${
                                        p.estado_cobertura === 'Adecuado' ? 'text-emerald-600' :
                                        p.estado_cobertura === 'Parcial' ? 'text-amber-600' :
                                        'text-rose-600'
                                      }`}>
                                        {p.estado_cobertura === 'Adecuado' ? '🟢 Adecuado' :
                                         p.estado_cobertura === 'Parcial' ? '🟡 Parcial' :
                                         '🔴 Insuficiente'}
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-mono">({p.porcentaje_cobertura?.toFixed(1)}%)</span>
                                    </div>
                                  </td>
                                  <td className="border border-slate-300 px-2 py-1.5 text-slate-600">{p.apoyo_supervision || 'No asignado'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
                            <span className="font-bold text-slate-700">Resumen de Cobertura:</span>
                            <p className="text-slate-600 mt-1">
                              Se han validado {generatedReport.polizasData.length} garantías contractuales. 
                              {generatedReport.polizasData.some((p: any) => p.estado === 'VENCIDA') 
                                ? ' Se identifican pólizas vencidas que requieren renovación inmediata.' 
                                : ' Todas las pólizas se encuentran dentro de su periodo de vigencia.'}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
                            <span className="font-bold text-slate-700">Riesgo Identificado:</span>
                            <p className="text-slate-600 mt-1">
                              {generatedReport.polizasData.reduce((sum: number, p: any) => sum + (p.riesgo_descubierto || 0), 0) > 0
                                ? `Se estima un riesgo descubierto de ${formatCurrency(generatedReport.polizasData.reduce((sum: number, p: any) => sum + (p.riesgo_descubierto || 0), 0))}.`
                                : 'No se identifican riesgos de cobertura insuficientes en el análisis actual.'}
                            </p>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* 7. Actividades Ejecutadas */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">7. Actividades Ejecutadas</h2>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {generatedReport.actividadesEjecutadas || 'No hay información de actividades ejecutadas.'}
                      </div>
                    </section>

                    {/* 8. Actividades Programadas */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">8. Actividades Programadas</h2>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {generatedReport.actividadesProgramadas || 'No hay información de actividades programadas.'}
                      </div>
                    </section>

                    {/* 9. Análisis Técnico y SISO */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">9. Análisis Técnico y SISO</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 leading-relaxed text-justify">
                          <h3 className="font-semibold text-slate-700 mb-2">Análisis Técnico</h3>
                          {generatedReport.analisisTecnico}
                        </div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                          <h3 className="font-semibold text-slate-700 mb-2">Reporte SISO Ambiental</h3>
                          {generatedReport.sisoAmbiental || 'No hay información SISO registrada.'}
                        </div>
                      </div>
                    </section>

                    {/* 10. Observaciones de Interventoría y Seguimiento */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">10. Observaciones de Interventoría y Seguimiento</h2>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-6">
                        <h3 className="font-semibold text-slate-700 mb-2">Observaciones Semanales</h3>
                        {generatedReport.observaciones || 'No hay observaciones registradas.'}
                      </div>

                      {generatedReport.seguimientos.length > 0 && (
                        <>
                          <h3 className="text-md font-semibold text-slate-700 mb-2">Registro de Seguimiento (Trackings)</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="border border-slate-300 px-3 py-2">Fecha</th>
                                  <th className="border border-slate-300 px-3 py-2">Reportado Por</th>
                                  <th className="border border-slate-300 px-3 py-2">Observaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {generatedReport.seguimientos.map((t: any, idx: number) => (
                                  <tr key={idx} className="bg-white">
                                    <td className="border border-slate-300 px-3 py-2 whitespace-nowrap font-medium">{t.fecha}</td>
                                    <td className="border border-slate-300 px-3 py-2">{t.reporta}</td>
                                    <td className="border border-slate-300 px-3 py-2">{t.observaciones}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </section>

                    {/* 11. Línea de Tiempo del Proyecto */}
                    <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">11. Línea de Tiempo del Proyecto</h2>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200">
                        <div className="space-y-4">
                          {generatedReport.timelineEvents?.slice(0, 10).map((event: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-start relative pb-4 last:pb-0">
                              {idx < Math.min(generatedReport.timelineEvents.length, 10) - 1 && (
                                <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-200"></div>
                              )}
                              <div className={`w-4 h-4 rounded-full mt-1.5 z-10 flex-shrink-0 ${
                                event.type === 'Póliza' ? 'bg-indigo-500' :
                                event.type === 'Otrosí' ? 'bg-amber-500' :
                                event.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{event.type}</span>
                                  <span className="text-[10px] font-mono text-slate-500">{formatDate(event.date)}</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800">{event.desc}</p>
                                {event.details && (
                                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{event.details}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {generatedReport.timelineEvents?.length > 10 && (
                            <p className="text-[10px] text-slate-400 italic text-center pt-2 border-t border-slate-200">
                              Se muestran los 10 eventos más relevantes. Ver el sistema para el historial completo.
                            </p>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* 12. Estado del Proyecto y Alertas */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">12. Estado del Proyecto y Alertas</h2>
                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded border border-slate-200 mb-6">
                        <span className="text-3xl">{generatedReport.estadoProyecto.color}</span>
                        <div>
                          <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Clasificación Automática</div>
                          <div className="text-xl font-bold text-slate-800">{generatedReport.estadoProyecto.texto}</div>
                        </div>
                      </div>

                      {generatedReport.alertasDetalladas.length > 0 ? (
                        <>
                          <h3 className="text-md font-semibold text-slate-700 mb-2">Registro de Alertas</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="border border-slate-300 px-3 py-2">Fecha</th>
                                  <th className="border border-slate-300 px-3 py-2">Nivel</th>
                                  <th className="border border-slate-300 px-3 py-2">Descripción</th>
                                  <th className="border border-slate-300 px-3 py-2">Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {generatedReport.alertasDetalladas.map((a: any, idx: number) => (
                                  <tr key={idx} className="bg-white">
                                    <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{a.fecha}</td>
                                    <td className="border border-slate-300 px-3 py-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        a.nivel === 'Alto' ? 'bg-red-100 text-red-700' :
                                        a.nivel === 'Medio' ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {a.nivel}
                                      </span>
                                    </td>
                                    <td className="border border-slate-300 px-3 py-2">{a.descripcion}</td>
                                    <td className="border border-slate-300 px-3 py-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        a.estado === 'Abierta' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {a.estado}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded border border-emerald-200 text-sm mb-6">
                          No se registran alertas para este proyecto.
                        </div>
                      )}

                      {generatedReport.ambientales.length > 0 && (
                        <>
                          <h3 className="text-md font-semibold text-slate-700 mb-2 mt-6">Gestión Ambiental y Permisos</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="border border-slate-300 px-3 py-2">Permiso</th>
                                  <th className="border border-slate-300 px-3 py-2">Resolución</th>
                                  <th className="border border-slate-300 px-3 py-2">Estado</th>
                                  <th className="border border-slate-300 px-3 py-2">Compensaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {generatedReport.ambientales.map((e: any, idx: number) => (
                                  <tr key={idx} className="bg-white">
                                    <td className="border border-slate-300 px-3 py-2 font-medium">{e.permiso}</td>
                                    <td className="border border-slate-300 px-3 py-2">{e.resolucion}</td>
                                    <td className="border border-slate-300 px-3 py-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        e.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' :
                                        e.estado === 'En Trámite' ? 'bg-amber-100 text-amber-700' :
                                        e.estado === 'Rechazado' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {e.estado}
                                      </span>
                                    </td>
                                    <td className="border border-slate-300 px-3 py-2">{e.compensaciones}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </section>

                    {/* 12. Análisis Inteligente */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                        📊 12. Análisis Inteligente
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Tendencia de Avance:</div>
                          <div className="text-slate-900">{generatedReport.analisisInteligente.tendencia}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Semanas Críticas (Sin avance):</div>
                          <div className="text-slate-900">{generatedReport.analisisInteligente.semanasCriticas}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Desviación Acumulada:</div>
                          <div className="text-slate-900">{generatedReport.analisisInteligente.desviacionAcumulada}%</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Alertas Activas:</div>
                          <div className="text-slate-900 whitespace-pre-wrap">{generatedReport.analisisInteligente.alertas}</div>
                        </div>
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Análisis Comparativo entre Periodos:</div>
                          <div className="text-slate-900 text-justify">{generatedReport.analisisInteligente.analisisComparativo}</div>
                        </div>
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Análisis de Desempeño del Contratista:</div>
                          <div className="text-slate-900 text-justify">{generatedReport.analisisInteligente.desempenoContratista}</div>
                        </div>
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Riesgos Potenciales Futuros:</div>
                          <div className="text-slate-900 text-justify">{generatedReport.analisisInteligente.riesgosFuturos}</div>
                        </div>
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded border border-slate-200">
                          <div className="font-semibold text-slate-700 mb-1">Conclusiones Automáticas:</div>
                          <div className="text-slate-900 text-justify">{generatedReport.analisisInteligente.conclusiones}</div>
                        </div>
                      </div>
                    </section>

                    {/* 13. Análisis de Inteligencia Artificial (Contexto Territorial) */}
                    {generatedReport.aiAnalysis && (
                      <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                          🤖 13. Análisis de Inteligencia Artificial (Contexto Territorial)
                        </h2>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                          <div className="bg-blue-50 p-4 rounded border border-blue-100">
                            <div className="font-semibold text-blue-900 mb-2">Análisis de Riesgo Territorial:</div>
                            <div className="text-blue-800 text-justify whitespace-pre-wrap">{generatedReport.aiAnalysis.analisisRiesgoTerritorial}</div>
                          </div>
                          <div className="bg-emerald-50 p-4 rounded border border-emerald-100">
                            <div className="font-semibold text-emerald-900 mb-2">Alineación con POD/POT:</div>
                            <div className="text-emerald-800 text-justify whitespace-pre-wrap">{generatedReport.aiAnalysis.alineacionPOD}</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded border border-purple-100">
                            <div className="font-semibold text-purple-900 mb-2">Recomendaciones Estratégicas:</div>
                            <div className="text-purple-800 text-justify whitespace-pre-wrap">{generatedReport.aiAnalysis.recomendacionesEstrategicas}</div>
                          </div>
                          <div className="bg-amber-50 p-4 rounded border border-amber-100">
                            <div className="font-semibold text-amber-900 mb-2">Impacto en Resiliencia Departamental:</div>
                            <div className="text-amber-800 text-justify whitespace-pre-wrap">{generatedReport.aiAnalysis.impactoResiliencia}</div>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* 14. Recomendaciones y Acciones Correctivas */}
                    <section className="mb-8">
                      <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                        🧠 14. Recomendaciones y Acciones Correctivas
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-50 p-4 rounded border border-indigo-100 text-sm">
                          <div className="font-semibold text-indigo-900 mb-2">Recomendaciones Técnicas:</div>
                          <div className="text-indigo-800 leading-relaxed whitespace-pre-wrap">{generatedReport.recomendaciones}</div>
                        </div>
                        <div className="bg-amber-50 p-4 rounded border border-amber-100 text-sm">
                          <div className="font-semibold text-amber-900 mb-2">Acciones Correctivas Sugeridas:</div>
                          <div className="text-amber-800 leading-relaxed whitespace-pre-wrap">{generatedReport.analisisInteligente.accionesCorrectivas}</div>
                        </div>
                      </div>
                    </section>

                    {/* 15. Soporte Visual (Gráficos) */}
                    {generatedReport.chartData && generatedReport.chartData.length > 0 && (
                      <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                          📈 15. Soporte Visual del Informe
                        </h2>
                        <div className="bg-white p-4 rounded border border-slate-200">
                          <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Evolución Avance Físico vs Programado</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={generatedReport.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <RechartsTooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line type="monotone" dataKey="Ejecutado" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="Programado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* 16. Registro Fotográfico */}
                    {generatedReport.fotografias && generatedReport.fotografias.length > 0 && (
                      <section className="mb-8">
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                          📸 16. Registro Fotográfico
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                          {generatedReport.fotografias.map((foto: any, index: number) => (
                            <div key={index} className="bg-slate-50 p-2 rounded border border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                              <img 
                                src={foto.url} 
                                alt={`Registro fotográfico semana ${foto.semana}`} 
                                className="w-full h-48 object-cover rounded mb-2"
                                crossOrigin="anonymous"
                              />
                              <div className="text-xs text-slate-600 font-medium">
                                Semana {foto.semana} - {foto.fecha}
                              </div>
                              <div className="text-xs text-slate-500">
                                {foto.descripcion}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* 17. Equipo OPS Asignado */}
                    {generatedReport.includeOps && generatedReport.opsData && generatedReport.opsData.length > 0 && (
                      <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                          👥 17. Equipo OPS Asignado
                        </h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Costo OPS</div>
                            <div className="text-lg font-bold text-slate-900">{formatCurrency(generatedReport.opsMetrics.totalCost)}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Desempeño Promedio</div>
                            <div className="text-lg font-bold text-indigo-700">{generatedReport.opsMetrics.performance}%</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Profesionales</div>
                            <div className="text-lg font-bold text-slate-900">{generatedReport.opsMetrics.count}</div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 font-bold">
                              <tr>
                                <th className="p-3 border border-slate-300">Nombre</th>
                                <th className="p-3 border border-slate-300">Rol</th>
                                <th className="p-3 border border-slate-300">Estado</th>
                                <th className="p-3 border border-slate-300 text-right">Honorarios Mensuales</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.opsData.map((ops: any, index: number) => (
                                <tr key={index} className="border-b border-slate-200">
                                  <td className="p-3 border border-slate-300 font-medium text-slate-900">{ops.nombre}</td>
                                  <td className="p-3 border border-slate-300 text-slate-700">{ops.rol}</td>
                                  <td className="p-3 border border-slate-300 text-slate-700">{ops.estado}</td>
                                  <td className="p-3 border border-slate-300 text-slate-900 text-right">{formatCurrency(ops.honorariosMensuales)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* 18. Comisiones en Terreno */}
                    {generatedReport.includeComisiones && generatedReport.comisionesData && generatedReport.comisionesData.length > 0 && (
                      <section className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-lg font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                          ✈️ 18. Comisiones en Terreno
                        </h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Costo Operativo</div>
                            <div className="text-lg font-bold text-slate-900">{formatCurrency(generatedReport.comisionesMetrics.totalCost)}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Visitas</div>
                            <div className="text-lg font-bold text-indigo-700">{generatedReport.comisionesMetrics.visitCount}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Resultados de Campo</div>
                            <div className="text-xs font-medium text-slate-700 truncate" title={generatedReport.comisionesMetrics.fieldResults}>{generatedReport.comisionesMetrics.fieldResults.substring(0, 50)}...</div>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 font-bold">
                              <tr>
                                <th className="p-3 border border-slate-300">Destino</th>
                                <th className="p-3 border border-slate-300">Fechas</th>
                                <th className="p-3 border border-slate-300">Objetivo</th>
                                <th className="p-3 border border-slate-300">Estado</th>
                                <th className="p-3 border border-slate-300 text-right">Costo Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedReport.comisionesData.map((com: any, index: number) => (
                                <tr key={index} className="border-b border-slate-200">
                                  <td className="p-3 border border-slate-300 font-medium text-slate-900">{com.destino}</td>
                                  <td className="p-3 border border-slate-300 text-slate-700">{com.fechaInicio} al {com.fechaFin}</td>
                                  <td className="p-3 border border-slate-300 text-slate-700">{com.objetivo}</td>
                                  <td className="p-3 border border-slate-300 text-slate-700">{com.estado}</td>
                                  <td className="p-3 border border-slate-300 text-slate-900 text-right">{formatCurrency(com.costoTotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                    </>
                    )}

                    <div className="mt-16 pt-8 border-t border-slate-300 text-center text-xs text-slate-500">
                      Documento generado automáticamente por el Sistema de Seguimiento SRR.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No hay informe generado</h3>
                <p className="max-w-md">
                  Seleccione un proyecto, configure los parámetros y elija los informes base para generar el documento institucional.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
