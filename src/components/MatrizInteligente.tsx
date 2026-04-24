import React, { useState, useMemo } from 'react';
import { ProjectData } from '../types';
import { Search, Filter, AlertTriangle, CheckCircle2, Clock, CalendarX2, Activity, LayoutGrid, List, BarChart2, ShieldAlert, FileX, Leaf, DollarSign, ExternalLink, BrainCircuit, Target, Zap, TrendingDown, Lightbulb, CheckSquare, Trophy, PieChart as PieChartIcon, MapPin, ThumbsUp, ThumbsDown, FileText, Download, Info, Settings, Users, Briefcase, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useProject } from '../store/ProjectContext';
import { AIProviderSelector } from './AIProviderSelector';

import { ProjectControlCard } from './ProjectControlCard';

interface MatrizInteligenteProps {
  projects: ProjectData[];
  onUpdateProject: (projectId: string, section: string, field: string, value: any) => void;
  onSelectProject: (project: ProjectData) => void;
}

type TabType = 'General' | 'Financiero' | 'Contratos' | 'Avance' | 'Alertas' | 'Ambiental';
type ViewMode = 'table' | 'cards' | 'dashboard' | 'analysis';
type StrategicFilter = 'all' | 'critical' | 'expiring' | 'no-execution';

export const MatrizInteligente: React.FC<MatrizInteligenteProps> = ({ projects, onUpdateProject, onSelectProject }) => {
  const { deleteProject } = useProject();
  const [activeTab, setActiveTab] = useState<TabType>('General');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [strategicFilter, setStrategicFilter] = useState<StrategicFilter>('all');
  const [userDecisions, setUserDecisions] = useState<Record<string, 'validated' | 'ignored'>>({});
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleDecision = (id: string, decision: 'validated' | 'ignored') => {
    setUserDecisions(prev => ({ ...prev, [id]: decision }));
  };
  
  const [filters, setFilters] = useState({
    departamento: '',
    estado: '',
    linea: '',
    vigencia: '',
    contratista: ''
  });

  // --- CAPA 3 & 4: INTELIGENCIA Y SEMÁFOROS ---
  const analyzeProject = (p: ProjectData) => {
    // Fechas y Atrasos
    const end = new Date(p.project.fechaFin);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = diffDays > 0 ? diffDays : 0;

    const expired = daysRemaining === 0 && p.project.estado !== 'Liquidado';
    const delay = p.project.avanceProgramado - p.project.avanceFisico;
    const actualDelay = delay > 0 ? delay : 0;

    // Financiero
    const hasCDP = p.presupuesto.cdp && p.presupuesto.cdp !== 'N/A' && p.presupuesto.cdp !== '';
    const hasRC = p.presupuesto.rc && p.presupuesto.rc !== 'N/A' && p.presupuesto.rc !== '';
    const missingCDP_RC = !hasCDP || !hasRC;

    const financialProgress = p.presupuesto.valorTotal > 0 
      ? (p.presupuesto.pagosRealizados / p.presupuesto.valorTotal) * 100 
      : 0;

    const financialInconsistency = 
      p.presupuesto.pagosRealizados > p.presupuesto.valorTotal ||
      (p.presupuesto.aportesFngrd + p.presupuesto.aportesMunicipio !== p.presupuesto.valorTotal);

    // Contratos
    const missingInterventoria = !p.contracts.some(c => c.tipo === 'Interventoría');

    // Ambiental
    const missingPermits = p.environmental.length === 0 || p.environmental.every(e => e.estado !== 'Aprobado' && e.estado !== 'No Aplica');

    // Semáforo Rules
    let semaforo: 'Crítico' | 'Riesgo' | 'Normal' = 'Normal';
    if (actualDelay > 20 || !hasCDP || expired) {
      semaforo = 'Crítico';
    } else if (actualDelay > 0 && actualDelay <= 20) {
      semaforo = 'Riesgo';
    }

    return {
      daysRemaining,
      expired,
      delay: actualDelay,
      hasCDP,
      hasRC,
      missingCDP_RC,
      financialProgress,
      financialInconsistency,
      missingInterventoria,
      missingPermits,
      semaforo
    };
  };

  // Extract unique values for filters
  const departamentos = useMemo(() => Array.from(new Set(projects.map(p => p.project.departamento))), [projects]);
  const estados = useMemo(() => Array.from(new Set(projects.map(p => p.project.estado))), [projects]);
  const lineas = useMemo(() => Array.from(new Set(projects.map(p => p.project.linea))), [projects]);
  const vigencias = useMemo(() => Array.from(new Set(projects.map(p => p.project.vigencia))), [projects]);
  const contratistas = useMemo(() => {
    const all = projects.flatMap(p => p.contracts.map(c => c.contratista));
    return Array.from(new Set(all));
  }, [projects]);

  // Filter logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const searchLower = (searchTerm || '').toLowerCase();
      const matchesSearch = 
        (p.project.nombre || '').toLowerCase().includes(searchLower) ||
        (p.project.id || '').toLowerCase().includes(searchLower) ||
        (p.project.municipio || '').toLowerCase().includes(searchLower) ||
        p.contracts.some(c => 
          (c.contratista || '').toLowerCase().includes(searchLower) || 
          (c.id || '').toLowerCase().includes(searchLower) ||
          (c.numero || '').toLowerCase().includes(searchLower)
        );

      const matchesDept = !filters.departamento || p.project.departamento === filters.departamento;
      const matchesEstado = !filters.estado || p.project.estado === filters.estado;
      const matchesLinea = !filters.linea || p.project.linea === filters.linea;
      const matchesVigencia = !filters.vigencia || p.project.vigencia === filters.vigencia;
      const matchesContratista = !filters.contratista || p.contracts.some(c => c.contratista === filters.contratista);

      // --- CAPA 8: FILTROS ESTRATÉGICOS ---
      const analysis = analyzeProject(p);
      let matchesStrategic = true;
      if (strategicFilter === 'critical') matchesStrategic = analysis.semaforo === 'Crítico';
      if (strategicFilter === 'expiring') matchesStrategic = analysis.daysRemaining <= 60 && analysis.daysRemaining > 0 && p.project.estado !== 'Liquidado';
      if (strategicFilter === 'no-execution') matchesStrategic = p.project.avanceFisico === 0 && p.project.estado !== 'Liquidado';

      return matchesSearch && matchesDept && matchesEstado && matchesLinea && matchesVigencia && matchesContratista && matchesStrategic;
    });
  }, [projects, searchTerm, filters, strategicFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const EditableCell = ({ value, type = 'text', onChange, className = '' }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    
    // Helper to format date strings to YYYY-MM-DD for input type="date"
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return '';
      // If it's already YYYY-MM-DD, return it
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      
      try {
        // Try to parse DD/MM/YY or DD/MM/YYYY
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          let [day, month, year] = parts;
          if (year.length === 2) {
            year = `20${year}`; // Assume 2000s for 2-digit years
          }
          if (day.length === 4) {
            // It might be YYYY-MM-DD or YYYY/MM/DD but split differently
            return `${day}-${month.padStart(2, '0')}-${year.padStart(2, '0')}`;
          }
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Fallback to Date parsing
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Could not parse date:', dateStr);
      }
      return '';
    };

    const initialValue = type === 'date' ? formatDateForInput(value) : value;
    const [localValue, setLocalValue] = useState(initialValue);

    const handleBlur = () => {
      setIsEditing(false);
      if (localValue !== initialValue) {
        onChange(localValue);
      }
    };

    if (isEditing) {
      return (
        <input
          type={type}
          autoFocus
          value={localValue}
          onChange={(e) => setLocalValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className="w-full px-2 py-1 text-sm border-2 border-indigo-500 rounded focus:outline-none focus:ring-0"
        />
      );
    }

    return (
      <div 
        onClick={() => setIsEditing(true)}
        className={`w-full px-2 py-1.5 text-sm cursor-text hover:bg-slate-200 rounded transition-colors min-h-[32px] flex items-center ${className}`}
      >
        {type === 'number' && typeof value === 'number' && value > 1000 ? formatCurrency(value) : value}
      </div>
    );
  };

  const SemaforoBadge = ({ status }: { status: 'Crítico' | 'Riesgo' | 'Normal' }) => {
    const colors = {
      'Crítico': 'bg-rose-500 shadow-rose-500/50',
      'Riesgo': 'bg-amber-500 shadow-amber-500/50',
      'Normal': 'bg-emerald-500 shadow-emerald-500/50'
    };
    return (
      <div className="flex items-center justify-center w-full">
        <div className={`w-4 h-4 rounded-full shadow-lg ${colors[status]}`} title={`Estado: ${status}`}></div>
      </div>
    );
  };

  const tabs: TabType[] = ['General', 'Financiero', 'Contratos', 'Avance', 'Alertas', 'Ambiental'];

  // --- CAPA 9: ANÁLISIS INTELIGENTE ---
  const generateSystemAnalysis = (projectsToAnalyze: ProjectData[]) => {
    const total = projectsToAnalyze.length;
    if (total === 0) return null;

    // Clasificación
    const finalizados = projectsToAnalyze.filter(p => p.project.estado === 'Liquidado' || p.project.estado === 'En liquidación');
    const criticos = projectsToAnalyze.filter(p => analyzeProject(p).semaforo === 'Crítico' && p.project.estado !== 'Liquidado' && p.project.estado !== 'En liquidación');
    const enRiesgo = projectsToAnalyze.filter(p => analyzeProject(p).semaforo === 'Riesgo' && p.project.estado !== 'Liquidado' && p.project.estado !== 'En liquidación');
    const estables = projectsToAnalyze.filter(p => analyzeProject(p).semaforo === 'Normal' && p.project.estado !== 'Liquidado' && p.project.estado !== 'En liquidación');

    // Porcentajes
    const pctCriticos = ((criticos.length / total) * 100).toFixed(1);
    const pctEnRiesgo = ((enRiesgo.length / total) * 100).toFixed(1);
    const pctFinalizados = ((finalizados.length / total) * 100).toFixed(1);
    const pctEstables = ((estables.length / total) * 100).toFixed(1);

    // Desviaciones
    const deviationsFisico = projectsToAnalyze.filter(p => (p.project.avanceProgramado - p.project.avanceFisico) > 20 && p.project.estado !== 'Liquidado');
    const deviationsFinanciero = projectsToAnalyze.filter(p => {
      const finProg = p.presupuesto.valorTotal > 0 ? (p.presupuesto.pagosRealizados / p.presupuesto.valorTotal) * 100 : 0;
      return Math.abs(finProg - p.project.avanceFisico) > 30 && p.project.estado !== 'Liquidado';
    });

    // Alertas Estratégicas
    const pctDelayed = ((deviationsFisico.length / total) * 100).toFixed(1);
    const strategicAlerts = [];
    if (Number(pctDelayed) > 20) {
      strategicAlerts.push(`El ${pctDelayed}% de los proyectos presentan retrasos físicos superiores al 20%.`);
    }
    if (deviationsFinanciero.length > 0) {
      const pctFinDev = ((deviationsFinanciero.length / total) * 100).toFixed(1);
      strategicAlerts.push(`El ${pctFinDev}% de los proyectos tienen una desviación mayor al 30% entre ejecución financiera y física.`);
    }
    const missingInterventoria = projectsToAnalyze.filter(p => analyzeProject(p).missingInterventoria && p.project.estado !== 'Liquidado');
    if (missingInterventoria.length > 0) {
      strategicAlerts.push(`${missingInterventoria.length} proyectos activos operan sin interventoría registrada.`);
    }

    // Top 10 Críticos
    const topCritical = [...criticos].sort((a, b) => {
      const delayA = a.project.avanceProgramado - a.project.avanceFisico;
      const delayB = b.project.avanceProgramado - b.project.avanceFisico;
      return delayB - delayA;
    }).slice(0, 10);

    // Mejores Desempeños
    const bestPerformers = [...estables].filter(p => p.project.avanceFisico > 0).sort((a, b) => {
      const delayA = a.project.avanceProgramado - a.project.avanceFisico;
      const delayB = b.project.avanceProgramado - b.project.avanceFisico;
      return delayA - delayB;
    }).slice(0, 5);

    // --- DATOS PARA GRÁFICOS ---
    const riskData = [
      { name: 'Críticos', value: criticos.length, color: '#f43f5e' },
      { name: 'En Riesgo', value: enRiesgo.length, color: '#f59e0b' },
      { name: 'Estables', value: estables.length, color: '#10b981' },
    ].filter(d => d.value > 0);

    const stateDistribution = Object.entries(
      projectsToAnalyze.reduce((acc, p) => {
        acc[p.project.estado] = (acc[p.project.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const deptDelay = Object.entries(
      projectsToAnalyze.reduce((acc, p) => {
        if (p.project.estado !== 'Liquidado' && p.project.estado !== 'En liquidación') {
          if (!acc[p.project.departamento]) acc[p.project.departamento] = { totalDelay: 0, count: 0 };
          const delay = p.project.avanceProgramado - p.project.avanceFisico;
          if (delay > 0) {
            acc[p.project.departamento].totalDelay += delay;
          }
          acc[p.project.departamento].count += 1;
        }
        return acc;
      }, {} as Record<string, { totalDelay: number, count: number }>)
    ).map(([name, data]) => ({
      name,
      retrasoPromedio: Number((data.totalDelay / data.count).toFixed(1))
    })).sort((a, b) => b.retrasoPromedio - a.retrasoPromedio).slice(0, 5);

    const lineExecution = Object.entries(
      projectsToAnalyze.reduce((acc, p) => {
        if (!acc[p.project.linea]) acc[p.project.linea] = { totalAvance: 0, count: 0 };
        acc[p.project.linea].totalAvance += p.project.avanceFisico;
        acc[p.project.linea].count += 1;
        return acc;
      }, {} as Record<string, { totalAvance: number, count: number }>)
    ).map(([name, data]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      avancePromedio: Number((data.totalAvance / data.count).toFixed(1)),
      fullName: name
    })).sort((a, b) => b.avancePromedio - a.avancePromedio).slice(0, 5);

    const timeProgress = Object.entries(
      projectsToAnalyze.reduce((acc, p) => {
        if (!acc[p.project.vigencia]) acc[p.project.vigencia] = { totalFisico: 0, totalProg: 0, count: 0 };
        acc[p.project.vigencia].totalFisico += p.project.avanceFisico;
        acc[p.project.vigencia].totalProg += p.project.avanceProgramado;
        acc[p.project.vigencia].count += 1;
        return acc;
      }, {} as Record<string, { totalFisico: number, totalProg: number, count: number }>)
    ).map(([name, data]) => ({
      name,
      Físico: Number((data.totalFisico / data.count).toFixed(1)),
      Programado: Number((data.totalProg / data.count).toFixed(1))
    })).sort((a, b) => a.name.localeCompare(b.name));

    // --- RECOMENDACIONES Y EXPLICABILIDAD ---
    const projectRecommendations = criticos.flatMap(p => {
      const recs = [];
      const delay = p.project.avanceProgramado - p.project.avanceFisico;
      const financialProgress = p.presupuesto.valorTotal > 0 ? (p.presupuesto.pagosRealizados / p.presupuesto.valorTotal) * 100 : 0;
      
      if (delay > 20) {
        recs.push({
          id: `rec-delay-${p.project.id}`,
          projectId: p.project.id,
          projectName: p.project.nombre,
          type: 'schedule',
          action: 'Optimización urgente del cronograma y aceleración de actividades críticas (Cuello de botella detectado).',
          reasoning: 'El proyecto presenta un atraso severo que compromete la fecha de entrega.',
          dataPoints: [`Avance Programado: ${p.project.avanceProgramado}%`, `Avance Real: ${p.project.avanceFisico}%`, `Desviación: ${delay.toFixed(1)}%`],
          relatedTo: ['comisiones', 'OPS']
        });
      }

      if (p.project.avanceFisico === 0 && p.project.estado === 'En ejecución') {
        recs.push({
          id: `rec-start-${p.project.id}`,
          projectId: p.project.id,
          projectName: p.project.nombre,
          type: 'technical',
          action: 'Intervención técnica inmediata. Programar visita de supervisión para identificar bloqueos.',
          reasoning: 'El proyecto está en estado activo pero no reporta ningún avance físico.',
          dataPoints: [`Estado: ${p.project.estado}`, `Avance Físico: 0%`],
          relatedTo: ['comisiones']
        });
      }

      if (Math.abs(financialProgress - p.project.avanceFisico) > 30) {
        recs.push({
          id: `rec-fin-${p.project.id}`,
          projectId: p.project.id,
          projectName: p.project.nombre,
          type: 'budget',
          action: 'Revisión de flujos de pago y posible redistribución de presupuesto.',
          reasoning: 'Existe una gran disparidad entre lo que se ha pagado y lo que se ha construido.',
          dataPoints: [`Avance Físico: ${p.project.avanceFisico}%`, `Ejecución Financiera: ${financialProgress.toFixed(1)}%`],
          relatedTo: ['presupuesto']
        });
      }

      if (!p.contracts.some(c => c.tipo === 'Interventoría')) {
        recs.push({
          id: `rec-inv-${p.project.id}`,
          projectId: p.project.id,
          projectName: p.project.nombre,
          type: 'contract',
          action: 'Revisar contrato y acelerar asignación de interventoría.',
          reasoning: 'El proyecto carece de supervisión externa registrada, aumentando el riesgo de control.',
          dataPoints: ['Interventoría: No asignada'],
          relatedTo: ['OPS', 'presupuesto']
        });
      }

      return recs;
    });

    const portfolioRecommendations = [];
    if (Number(pctCriticos) > 15) {
      portfolioRecommendations.push({
        id: 'port-crit',
        action: 'Priorización territorial e intervención urgente en departamentos críticos.',
        reasoning: 'Alta concentración de proyectos en estado crítico a nivel global.',
        dataPoints: [`Proyectos Críticos: ${pctCriticos}% (> 15% umbral)`],
        relatedTo: ['comisiones']
      });
    }
    if (deviationsFinanciero.length > total * 0.1) {
      portfolioRecommendations.push({
        id: 'port-fin',
        action: 'Auditoría financiera global y redistribución de presupuesto.',
        reasoning: 'Múltiples proyectos presentan desfases significativos entre pagos y avance físico.',
        dataPoints: [`Proyectos con desfase: ${deviationsFinanciero.length} (${((deviationsFinanciero.length/total)*100).toFixed(1)}%)`],
        relatedTo: ['presupuesto']
      });
    }

    return {
      total,
      finalizados: finalizados.length,
      criticos: criticos.length,
      enRiesgo: enRiesgo.length,
      estables: estables.length,
      pctCriticos,
      pctEnRiesgo,
      pctFinalizados,
      pctEstables,
      strategicAlerts,
      topCritical,
      bestPerformers,
      deviationsFisico: deviationsFisico.length,
      deviationsFinanciero: deviationsFinanciero.length,
      riskData,
      stateDistribution,
      deptDelay,
      lineExecution,
      timeProgress,
      projectRecommendations,
      portfolioRecommendations
    };
  };

  const downloadReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateExecutiveSummary = () => {
    const analysis = generateSystemAnalysis(filteredProjects);
    if (!analysis) return;

    let report = `# Resumen Ejecutivo del Portafolio SRR\n\n`;
    report += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
    
    report += `## 1. Estado General\n`;
    report += `- Total Proyectos Analizados: ${analysis.total}\n`;
    report += `- Proyectos Críticos: ${analysis.criticos} (${analysis.pctCriticos}%)\n`;
    report += `- Proyectos En Riesgo: ${analysis.enRiesgo} (${analysis.pctEnRiesgo}%)\n`;
    report += `- Proyectos Estables: ${analysis.estables} (${analysis.pctEstables}%)\n`;
    report += `- Proyectos Finalizados: ${analysis.finalizados} (${analysis.pctFinalizados}%)\n\n`;
    
    report += `## 2. Principales Riesgos y Desviaciones\n`;
    analysis.strategicAlerts.forEach(a => {
      report += `- ${a}\n`;
    });
    report += `- Proyectos con atraso > 20%: ${analysis.deviationsFisico}\n`;
    report += `- Proyectos con desfase financiero > 30%: ${analysis.deviationsFinanciero}\n\n`;

    report += `## 3. Top 5 Proyectos Críticos\n`;
    analysis.topCritical.slice(0, 5).forEach(p => {
      report += `- [${p.project.id}] ${p.project.nombre} (Atraso: ${(p.project.avanceProgramado - p.project.avanceFisico).toFixed(1)}%)\n`;
    });
    report += `\n`;

    report += `## 4. Recomendaciones Estratégicas a Nivel Portafolio\n`;
    analysis.portfolioRecommendations.forEach(r => {
      report += `- Acción: ${r.action}\n  Justificación: ${r.reasoning}\n`;
    });
    report += `\n`;

    report += `## 5. Recomendaciones Específicas por Proyecto Crítico\n`;
    analysis.projectRecommendations.slice(0, 10).forEach(r => {
      report += `- Proyecto [${r.projectId}]: ${r.action}\n  Justificación: ${r.reasoning}\n`;
    });

    downloadReport(report, `Resumen_Ejecutivo_SRR_${new Date().toISOString().split('T')[0]}.md`);
  };

  const handleGenerateDeptReport = () => {
    const analysis = generateSystemAnalysis(filteredProjects);
    if (!analysis) return;

    let report = `# Informe por Departamentos SRR\n\n`;
    report += `Fecha de generación: ${new Date().toLocaleDateString()}\n\n`;
    
    report += `## Top Departamentos con Mayor Retraso Promedio\n\n`;
    analysis.deptDelay.forEach(d => {
      report += `- ${d.name}: ${d.retrasoPromedio}% de retraso promedio\n`;
    });
    
    downloadReport(report, `Informe_Departamentos_SRR_${new Date().toISOString().split('T')[0]}.md`);
  };

  const handleGenerateProjectReport = (p: ProjectData) => {
    let report = `# Informe de Proyecto: ${p.project.id}\n\n`;
    report += `## Información General\n`;
    report += `- Nombre: ${p.project.nombre}\n`;
    report += `- Departamento: ${p.project.departamento}\n`;
    report += `- Estado: ${p.project.estado}\n`;
    report += `- Avance Físico: ${p.project.avanceFisico}%\n`;
    report += `- Avance Programado: ${p.project.avanceProgramado}%\n\n`;
    
    downloadReport(report, `Informe_Proyecto_${p.project.id}.md`);
  };

  const generateConclusions = () => {
    const total = projects.length;
    const critical = projects.filter(p => analyzeProject(p).semaforo === 'Crítico').length;
    const expiring = projects.filter(p => analyzeProject(p).daysRemaining <= 60 && analyzeProject(p).daysRemaining > 0 && p.project.estado !== 'Liquidado').length;
    const noExec = projects.filter(p => p.project.avanceFisico === 0 && p.project.estado !== 'Liquidado').length;
    const missingInterventoria = projects.filter(p => analyzeProject(p).missingInterventoria).length;
    const missingCDP_RC = projects.filter(p => analyzeProject(p).missingCDP_RC).length;
    const delayed = projects.filter(p => analyzeProject(p).delay > 0).length;
    const missingPermits = projects.filter(p => analyzeProject(p).missingPermits).length;

    return (
      <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <BrainCircuit size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BrainCircuit size={24} className="text-indigo-400" />
            Análisis Inteligente del Portafolio
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Conclusiones del Estado */}
            <div className="bg-indigo-800/50 p-5 rounded-xl border border-indigo-700/50">
              <h4 className="text-indigo-300 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                <Target size={16} /> Estado de la Matriz
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                  <p className="text-indigo-100 leading-relaxed">
                    De <strong className="text-white">{total}</strong> proyectos, <strong className="text-rose-400">{critical}</strong> están en estado <strong className="text-rose-400">Crítico</strong>.
                  </p>
                </li>
                {expiring > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></div>
                    <p className="text-indigo-100 leading-relaxed">
                      <strong className="text-amber-400">{expiring}</strong> proyectos vencerán en los próximos 60 días.
                    </p>
                  </li>
                )}
                {noExec > 0 && (
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                    <p className="text-indigo-100 leading-relaxed">
                      <strong className="text-white">{noExec}</strong> proyectos tienen <strong className="text-white">0% de ejecución física</strong>.
                    </p>
                  </li>
                )}
              </ul>
            </div>

            {/* 2. Patrones de Riesgo */}
            <div className="bg-rose-900/30 p-5 rounded-xl border border-rose-800/50">
              <h4 className="text-rose-300 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                <TrendingDown size={16} /> Patrones de Riesgo
              </h4>
              <ul className="space-y-3 text-sm">
                {missingCDP_RC > 0 && (
                  <li className="flex items-start gap-3">
                    <ShieldAlert size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-rose-100 leading-relaxed">
                      <strong className="text-white">Financiero:</strong> {missingCDP_RC} proyectos carecen de soportes presupuestales (CDP/RC).
                    </p>
                  </li>
                )}
                {missingInterventoria > 0 && (
                  <li className="flex items-start gap-3">
                    <ShieldAlert size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-rose-100 leading-relaxed">
                      <strong className="text-white">Control:</strong> {missingInterventoria} proyectos operan sin interventoría asignada.
                    </p>
                  </li>
                )}
                {delayed > 0 && (
                  <li className="flex items-start gap-3">
                    <ShieldAlert size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-rose-100 leading-relaxed">
                      <strong className="text-white">Ejecución:</strong> {delayed} proyectos presentan atrasos frente a su cronograma.
                    </p>
                  </li>
                )}
                {missingPermits > 0 && (
                  <li className="flex items-start gap-3">
                    <ShieldAlert size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-rose-100 leading-relaxed">
                      <strong className="text-white">Ambiental:</strong> {missingPermits} proyectos no tienen permisos ambientales aprobados.
                    </p>
                  </li>
                )}
              </ul>
            </div>

            {/* 3. Acciones Correctivas */}
            <div className="bg-emerald-900/30 p-5 rounded-xl border border-emerald-800/50">
              <h4 className="text-emerald-300 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                <Lightbulb size={16} /> Acciones Sugeridas
              </h4>
              <ul className="space-y-3 text-sm">
                {missingCDP_RC > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-emerald-100 leading-relaxed">
                      Solicitar emisión urgente de CDP/RC para los {missingCDP_RC} proyectos sin soporte.
                    </p>
                  </li>
                )}
                {missingInterventoria > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-emerald-100 leading-relaxed">
                      Acelerar contratación de interventoría para {missingInterventoria} proyectos en riesgo.
                    </p>
                  </li>
                )}
                {noExec > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-emerald-100 leading-relaxed">
                      Revisar actas de inicio y bloqueos en los {noExec} proyectos sin ejecución física.
                    </p>
                  </li>
                )}
                {expiring > 0 && (
                  <li className="flex items-start gap-3">
                    <CheckSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-emerald-100 leading-relaxed">
                      Gestionar prórrogas o cierres para los {expiring} proyectos próximos a vencer.
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* CAPA DE CONTROL: ALERTAS GLOBALES */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center gap-6 overflow-hidden shrink-0">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs shrink-0">
          <Zap size={14} className="animate-pulse" />
          ESTADO CRÍTICO:
        </div>
        <div className="flex-1 overflow-hidden relative h-5">
          <div className="absolute inset-0 flex items-center gap-12 animate-marquee whitespace-nowrap text-xs font-medium text-slate-300">
            {projects.flatMap(p => p.alerts).filter(a => a.nivel === 'Alto' && a.estado === 'Abierta').map((a, i) => (
              <span key={i} className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                {a.tipo}: {a.descripcion}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {projects.flatMap(p => p.alerts).filter(a => a.nivel === 'Alto' && a.estado === 'Abierta').map((a, i) => (
              <span key={`dup-${i}`} className="flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-500" />
                {a.tipo}: {a.descripcion}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 shrink-0">
          <span>ACTUALIZADO: {new Date().toLocaleTimeString()}</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            LIVE
          </div>
        </div>
      </div>

      {/* Header & View Switcher */}
      <div className="bg-white border-b border-slate-200 p-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="text-indigo-600" />
              Matriz Inteligente de Seguimiento
            </h1>
            <p className="text-slate-500 mt-1">Control Center 360° - Análisis Predictivo y Gestión de Riesgos</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* CAPA 8: Filtros Estratégicos */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setStrategicFilter('all')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${strategicFilter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              >
                TODOS
              </button>
              <button 
                onClick={() => setStrategicFilter('critical')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${strategicFilter === 'critical' ? 'bg-rose-500 shadow-sm text-white' : 'text-slate-500 hover:text-rose-600'}`}
              >
                <AlertTriangle size={14} /> CRÍTICOS
              </button>
              <button 
                onClick={() => setStrategicFilter('expiring')} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${strategicFilter === 'expiring' ? 'bg-amber-500 shadow-sm text-white' : 'text-slate-500 hover:text-amber-600'}`}
              >
                <Clock size={14} /> POR VENCER
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setViewMode('table')} 
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} 
                title="Vista Tabla"
              >
                <List size={20} />
              </button>
              <button 
                onClick={() => setViewMode('cards')} 
                className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} 
                title="Vista Tarjetas Control"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('dashboard')} 
                className={`p-2 rounded-lg transition-all ${viewMode === 'dashboard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} 
                title="Vista Dashboard"
              >
                <BarChart2 size={20} />
              </button>
              <button 
                onClick={() => setViewMode('analysis')} 
                className={`p-2 rounded-lg transition-all ${viewMode === 'analysis' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} 
                title="Análisis Inteligente"
              >
                <BrainCircuit size={20} />
              </button>
            </div>

            <div className="hidden sm:block">
              <AIProviderSelector />
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm">
              <Download size={18} />
              Exportar
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Proyectos</div>
            <div className="text-xl font-bold text-slate-900">{projects.length}</div>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
            <div className="text-[10px] font-bold text-rose-400 uppercase mb-1">Críticos</div>
            <div className="text-xl font-bold text-rose-600">{projects.filter(p => analyzeProject(p).semaforo === 'Crítico').length}</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
            <div className="text-[10px] font-bold text-amber-500 uppercase mb-1">En Riesgo</div>
            <div className="text-xl font-bold text-amber-600">{projects.filter(p => analyzeProject(p).semaforo === 'Riesgo').length}</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Normales</div>
            <div className="text-xl font-bold text-emerald-600">{projects.filter(p => analyzeProject(p).semaforo === 'Normal').length}</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
            <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Inversión</div>
            <div className="text-xl font-bold text-indigo-600">${(projects.reduce((acc, p) => acc + p.presupuesto.valorTotal, 0) / 1000000).toFixed(1)}M</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avance Prom.</div>
            <div className="text-xl font-bold text-slate-900">{(projects.reduce((acc, p) => acc + p.project.avanceFisico, 0) / projects.length).toFixed(1)}%</div>
          </div>
        </div>
      </div>
        
        {viewMode === 'table' && (
          <div className="px-6 flex space-x-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab 
                    ? 'border-indigo-500 text-indigo-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      
      {/* Toolbar: Search & Filters */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar proyecto, contrato o municipio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} className="text-slate-400" />
          <select value={filters.departamento} onChange={(e) => setFilters({...filters, departamento: e.target.value})} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
            <option value="">Departamento (Todos)</option>
            {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.estado} onChange={(e) => setFilters({...filters, estado: e.target.value})} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
            <option value="">Estado (Todos)</option>
            {estados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filters.vigencia} onChange={(e) => setFilters({...filters, vigencia: e.target.value})} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
            <option value="">Vigencia (Todas)</option>
            {vigencias.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* --- VISTA: TABLA --- */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
              <tr className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3 border-b border-r border-slate-200 bg-slate-100 sticky left-0 z-20 w-12 text-center" title="Semáforo Automático">🚦</th>
                <th className="p-3 border-b border-r border-slate-200 bg-slate-100 sticky left-12 z-20 w-32">ID Proyecto</th>
                <th className="p-3 border-b border-r border-slate-200 bg-slate-100 sticky left-44 z-20 w-64">Nombre</th>
                
                {activeTab === 'General' && (
                  <>
                    <th className="p-3 border-b border-r border-slate-200">Departamento</th>
                    <th className="p-3 border-b border-r border-slate-200">Municipio</th>
                    <th className="p-3 border-b border-r border-slate-200">Línea</th>
                    <th className="p-3 border-b border-r border-slate-200">Vigencia</th>
                    <th className="p-3 border-b border-r border-slate-200">Estado</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-indigo-50 text-indigo-800">Días Restantes 🧠</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-indigo-50 text-indigo-800">Alerta Vencimiento 🧠</th>
                  </>
                )}

                {activeTab === 'Avance' && (
                  <>
                    <th className="p-3 border-b border-r border-slate-200">Avance Físico (%)</th>
                    <th className="p-3 border-b border-r border-slate-200">Avance Programado (%)</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-indigo-50 text-indigo-800">Atraso Ejecución 🧠</th>
                    <th className="p-3 border-b border-r border-slate-200">Fecha Inicio</th>
                    <th className="p-3 border-b border-r border-slate-200">Fecha Fin</th>
                  </>
                )}

                {activeTab === 'Financiero' && (
                  <>
                    <th className="p-3 border-b border-r border-slate-200">Valor Total</th>
                    <th className="p-3 border-b border-r border-slate-200">Pagos Realizados</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-indigo-50 text-indigo-800">Avance Fin. Ponderado 🧠</th>
                    <th className="p-3 border-b border-r border-slate-200">CDP</th>
                    <th className="p-3 border-b border-r border-slate-200">RC</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-rose-50 text-rose-800">Falta CDP/RC 🧠</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-rose-50 text-rose-800">Inconsistencias 🧠</th>
                  </>
                )}

                {activeTab === 'Contratos' && (
                  <>
                    <th className="p-3 border-b border-r border-slate-200">Contratista Principal</th>
                    <th className="p-3 border-b border-r border-slate-200">NIT</th>
                    <th className="p-3 border-b border-r border-slate-200">Valor Contrato Obra</th>
                    <th className="p-3 border-b border-r border-slate-200">Interventoría</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-rose-50 text-rose-800">Sin Interventoría 🧠</th>
                  </>
                )}

                {activeTab === 'Alertas' && (
                  <>
                    <th className="p-3 border-b border-r border-slate-200">Total Alertas</th>
                    <th className="p-3 border-b border-r border-slate-200">Alertas Altas</th>
                    <th className="p-3 border-b border-r border-slate-200">Última Alerta</th>
                  </>
                )}

                {activeTab === 'Ambiental' && (
                  <>
                    <th className="p-3 border-b border-r border-slate-200">Permiso Principal</th>
                    <th className="p-3 border-b border-r border-slate-200">Estado Permiso</th>
                    <th className="p-3 border-b border-r border-slate-200 bg-rose-50 text-rose-800">Falta Permisos 🧠</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.map(p => {
                const analysis = analyzeProject(p);
                const obraContract = p.contracts.find(c => c.tipo === 'Obra');
                const interContract = p.contracts.find(c => c.tipo === 'Interventoría');

                return (
                  <tr key={p.project.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-2 border-r border-slate-200 bg-white group-hover:bg-indigo-50/30 sticky left-0 z-10">
                      <SemaforoBadge status={analysis.semaforo} />
                    </td>
                    <td className="p-2 border-r border-slate-200 bg-white group-hover:bg-indigo-50/30 sticky left-12 z-10 font-mono text-sm">
                      <button 
                        onClick={() => onSelectProject(p)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold"
                        title="Abrir Ficha 360°"
                      >
                        {p.project.id} <ExternalLink size={12} />
                      </button>
                      <button 
                        onClick={() => setProjectToDelete(p.project.id)}
                        className="text-rose-600 hover:text-rose-800 ml-2"
                        title="Borrar Proyecto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                    <td className="p-2 border-r border-slate-200 bg-white group-hover:bg-indigo-50/30 sticky left-44 z-10">
                      <EditableCell value={p.project.nombre} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'nombre', v)} className="font-medium text-slate-900 truncate max-w-[240px]" />
                    </td>

                    {/* GENERAL TAB */}
                    {activeTab === 'General' && (
                      <>
                        <td className="p-2 border-r border-slate-200"><EditableCell value={p.project.departamento} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'departamento', v)} /></td>
                        <td className="p-2 border-r border-slate-200"><EditableCell value={p.project.municipio} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'municipio', v)} /></td>
                        <td className="p-2 border-r border-slate-200"><EditableCell value={p.project.linea} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'linea', v)} /></td>
                        <td className="p-2 border-r border-slate-200"><EditableCell value={p.project.vigencia} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'vigencia', v)} /></td>
                        <td className="p-2 border-r border-slate-200">
                          <select value={p.project.estado} onChange={(e) => onUpdateProject(p.project.id, 'project', 'estado', e.target.value)} className="w-full px-2 py-1.5 text-sm bg-transparent border-transparent hover:bg-slate-100 rounded focus:bg-white focus:border-indigo-500 focus:ring-2 outline-none cursor-pointer">
                            <option value="Banco de proyectos">Banco de proyectos</option>
                            <option value="En viabilidad">En viabilidad</option>
                            <option value="En estructuración">En estructuración</option>
                            <option value="Aprobado">Aprobado</option>
                            <option value="En contratación">En contratación</option>
                            <option value="En ejecución">En ejecución</option>
                            <option value="En seguimiento">En seguimiento</option>
                            <option value="En liquidación">En liquidación</option>
                            <option value="Liquidado">Liquidado</option>
                          </select>
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-indigo-50/30">
                          <div className="px-2 py-1.5 text-sm font-mono font-medium text-slate-700 flex items-center gap-2">
                            <Clock size={14} className="text-indigo-500" /> {analysis.daysRemaining} días
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-indigo-50/30">
                          {analysis.expired ? (
                            <div className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-md inline-flex items-center gap-1"><CalendarX2 size={14} /> VENCIDO</div>
                          ) : (
                            <div className="px-2 py-1 text-xs font-medium text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> En tiempo</div>
                          )}
                        </td>
                      </>
                    )}

                    {/* AVANCE TAB */}
                    {activeTab === 'Avance' && (
                      <>
                        <td className="p-2 border-r border-slate-200"><EditableCell type="number" value={p.project.avanceFisico} onChange={(v: number) => onUpdateProject(p.project.id, 'project', 'avanceFisico', v)} /></td>
                        <td className="p-2 border-r border-slate-200"><EditableCell type="number" value={p.project.avanceProgramado} onChange={(v: number) => onUpdateProject(p.project.id, 'project', 'avanceProgramado', v)} /></td>
                        <td className="p-2 border-r border-slate-200 bg-indigo-50/30">
                          {analysis.delay > 0 ? (
                            <div className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-md inline-flex items-center gap-1"><AlertTriangle size={14} /> {analysis.delay}% ATRASO</div>
                          ) : (
                            <div className="px-2 py-1 text-xs font-medium text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Al día</div>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200"><EditableCell type="date" value={p.project.fechaInicio} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'fechaInicio', v)} /></td>
                        <td className="p-2 border-r border-slate-200"><EditableCell type="date" value={p.project.fechaFin} onChange={(v: string) => onUpdateProject(p.project.id, 'project', 'fechaFin', v)} /></td>
                      </>
                    )}

                    {/* FINANCIERO TAB */}
                    {activeTab === 'Financiero' && (
                      <>
                        <td className="p-2 border-r border-slate-200 font-mono"><EditableCell type="number" value={p.presupuesto.valorTotal} onChange={(v: number) => onUpdateProject(p.project.id, 'presupuesto', 'valorTotal', v)} /></td>
                        <td className="p-2 border-r border-slate-200 font-mono"><EditableCell type="number" value={p.presupuesto.pagosRealizados} onChange={(v: number) => onUpdateProject(p.project.id, 'presupuesto', 'pagosRealizados', v)} /></td>
                        <td className="p-2 border-r border-slate-200 bg-indigo-50/30">
                          <div className="px-2 py-1.5 text-sm font-bold text-indigo-700">{analysis.financialProgress.toFixed(1)}%</div>
                        </td>
                        <td className="p-2 border-r border-slate-200"><EditableCell value={p.presupuesto.cdp} onChange={(v: string) => onUpdateProject(p.project.id, 'presupuesto', 'cdp', v)} /></td>
                        <td className="p-2 border-r border-slate-200"><EditableCell value={p.presupuesto.rc} onChange={(v: string) => onUpdateProject(p.project.id, 'presupuesto', 'rc', v)} /></td>
                        <td className="p-2 border-r border-slate-200 bg-rose-50/30">
                          {analysis.missingCDP_RC ? (
                            <div className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-md inline-flex items-center gap-1"><FileX size={14} /> SIN CDP/RC</div>
                          ) : (
                            <div className="px-2 py-1 text-xs font-medium text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> OK</div>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-rose-50/30">
                          {analysis.financialInconsistency ? (
                            <div className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-md inline-flex items-center gap-1"><ShieldAlert size={14} /> INCONSISTENTE</div>
                          ) : (
                            <div className="px-2 py-1 text-xs font-medium text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> OK</div>
                          )}
                        </td>
                      </>
                    )}

                    {/* CONTRATOS TAB */}
                    {activeTab === 'Contratos' && (
                      <>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm">{obraContract?.contratista || 'N/A'}</div></td>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm font-mono">{obraContract?.nit || 'N/A'}</div></td>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm font-mono">{obraContract ? formatCurrency(obraContract.valor) : 'N/A'}</div></td>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm">{interContract?.contratista || 'N/A'}</div></td>
                        <td className="p-2 border-r border-slate-200 bg-rose-50/30">
                          {analysis.missingInterventoria ? (
                            <div className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-md inline-flex items-center gap-1"><AlertTriangle size={14} /> SIN INTERVENTORÍA</div>
                          ) : (
                            <div className="px-2 py-1 text-xs font-medium text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> OK</div>
                          )}
                        </td>
                      </>
                    )}

                    {/* ALERTAS TAB */}
                    {activeTab === 'Alertas' && (
                      <>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm font-medium">{p.alerts.length}</div></td>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm font-medium text-rose-600">{p.alerts.filter(a => a.nivel === 'Alto' && a.estado === 'Abierta').length}</div></td>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm text-slate-500">{p.alerts.length > 0 ? p.alerts[0].descripcion : 'Sin alertas'}</div></td>
                      </>
                    )}

                    {/* AMBIENTAL TAB */}
                    {activeTab === 'Ambiental' && (
                      <>
                        <td className="p-2 border-r border-slate-200"><div className="px-2 py-1.5 text-sm">{p.environmental[0]?.permiso || 'N/A'}</div></td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="px-2 py-1.5 text-sm">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${p.environmental[0]?.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {p.environmental[0]?.estado || 'N/A'}
                              </span>
                          </div>
                        </td>
                        <td className="p-2 border-r border-slate-200 bg-rose-50/30">
                          {analysis.missingPermits ? (
                            <div className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-md inline-flex items-center gap-1"><Leaf size={14} /> FALTA PERMISO</div>
                          ) : (
                            <div className="px-2 py-1 text-xs font-medium text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> OK</div>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">No se encontraron proyectos que coincidan con los filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- VISTA: TARJETAS --- */}
      {viewMode === 'cards' && (
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(p => (
              <ProjectControlCard 
                key={p.project.id}
                project={p}
                onSelect={onSelectProject}
                formatCurrency={formatCurrency}
                analysis={analyzeProject(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* --- VISTA: DASHBOARD --- */}
      {viewMode === 'dashboard' && (
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="mb-8">
            {generateConclusions()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><AlertTriangle size={24} /></div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{filteredProjects.filter(p => analyzeProject(p).semaforo === 'Crítico').length}</div>
                <div className="text-sm text-slate-500 font-medium">Proyectos Críticos</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Clock size={24} /></div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{filteredProjects.filter(p => analyzeProject(p).semaforo === 'Riesgo').length}</div>
                <div className="text-sm text-slate-500 font-medium">Proyectos en Riesgo</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 size={24} /></div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{filteredProjects.filter(p => analyzeProject(p).semaforo === 'Normal').length}</div>
                <div className="text-sm text-slate-500 font-medium">Proyectos Normales</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Alertas Automáticas Detectadas</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="flex items-center gap-3"><FileX className="text-rose-500" size={20} /><span className="font-medium text-rose-900">Sin CDP o RC</span></div>
                  <span className="font-bold text-rose-700 text-lg">{filteredProjects.filter(p => analyzeProject(p).missingCDP_RC).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="flex items-center gap-3"><ShieldAlert className="text-rose-500" size={20} /><span className="font-medium text-rose-900">Inconsistencias Financieras</span></div>
                  <span className="font-bold text-rose-700 text-lg">{filteredProjects.filter(p => analyzeProject(p).financialInconsistency).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="flex items-center gap-3"><AlertTriangle className="text-rose-500" size={20} /><span className="font-medium text-rose-900">Sin Interventoría</span></div>
                  <span className="font-bold text-rose-700 text-lg">{filteredProjects.filter(p => analyzeProject(p).missingInterventoria).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="flex items-center gap-3"><Leaf className="text-rose-500" size={20} /><span className="font-medium text-rose-900">Falta Permiso Ambiental</span></div>
                  <span className="font-bold text-rose-700 text-lg">{filteredProjects.filter(p => analyzeProject(p).missingPermits).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- VISTA: ANÁLISIS AUTOMÁTICO DEL SISTEMA --- */}
      {viewMode === 'analysis' && (
        <div className="flex-1 overflow-auto bg-slate-50 p-6 space-y-6">
          {(() => {
            const analysis = generateSystemAnalysis(filteredProjects);
            if (!analysis) return <div className="text-center text-slate-500 p-8">No hay proyectos para analizar con los filtros actuales.</div>;

            return (
              <>
                {/* Header */}
                <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit className="text-indigo-400" /> Análisis Automático del Sistema</h2>
                    <p className="text-indigo-200 mt-1">Estado actual del portafolio de proyectos SRR</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 bg-indigo-800/50 px-3 py-2 rounded-xl border border-indigo-700/50">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Motor IA:</span>
                      <AIProviderSelector />
                    </div>
                    <button onClick={handleGenerateExecutiveSummary} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-indigo-500">
                      <FileText size={16} /> Resumen Ejecutivo
                    </button>
                    <button onClick={handleGenerateDeptReport} className="flex items-center gap-2 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-indigo-700">
                      <Download size={16} /> Informe Deptos
                    </button>
                    <div className="text-left md:text-right bg-indigo-800/50 px-6 py-3 rounded-xl border border-indigo-700/50 ml-2">
                      <div className="text-4xl font-black text-white">{analysis.total}</div>
                      <div className="text-indigo-300 text-xs uppercase tracking-widest font-bold">Proyectos</div>
                    </div>
                  </div>
                </div>

                {/* Classification Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Críticos</div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-800">{analysis.criticos}</span>
                      <span className="text-rose-500 font-bold mb-1">({analysis.pctCriticos}%)</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">En Riesgo</div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-800">{analysis.enRiesgo}</span>
                      <span className="text-amber-500 font-bold mb-1">({analysis.pctEnRiesgo}%)</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Estables</div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-800">{analysis.estables}</span>
                      <span className="text-emerald-500 font-bold mb-1">({analysis.pctEstables}%)</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-slate-500">
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Finalizados</div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-800">{analysis.finalizados}</span>
                      <span className="text-slate-500 font-bold mb-1">({analysis.pctFinalizados}%)</span>
                    </div>
                  </div>
                </div>

                {/* Strategic Alerts & Deviations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-rose-50 p-6 rounded-xl border border-rose-100 shadow-sm">
                    <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Alertas Estratégicas</h3>
                    <ul className="space-y-3">
                      {analysis.strategicAlerts.map((alert, i) => (
                        <li key={i} className="flex items-start gap-3 text-rose-800 bg-white p-4 rounded-lg border border-rose-100 shadow-sm">
                          <div className="mt-0.5"><ShieldAlert size={18} className="text-rose-500" /></div>
                          <span className="font-medium text-sm leading-relaxed">{alert}</span>
                        </li>
                      ))}
                      {analysis.strategicAlerts.length === 0 && (
                        <li className="text-emerald-700 bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-sm">
                          <CheckCircle2 size={18} /> <span className="font-medium text-sm">No se detectaron alertas estratégicas a nivel de portafolio.</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 shadow-sm">
                    <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2"><TrendingDown size={20} /> Desviaciones Detectadas</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-5 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between">
                        <div>
                          <div className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Avance Programado vs Real</div>
                          <div className="text-sm font-medium text-amber-800">Proyectos con &gt;20% de atraso</div>
                        </div>
                        <div className="text-3xl font-black text-amber-600">{analysis.deviationsFisico}</div>
                      </div>
                      <div className="bg-white p-5 rounded-lg border border-amber-200 shadow-sm flex items-center justify-between">
                        <div>
                          <div className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Ejecución Financiera vs Física</div>
                          <div className="text-sm font-medium text-amber-800">Proyectos con desfase &gt;30%</div>
                        </div>
                        <div className="text-3xl font-black text-amber-600">{analysis.deviationsFinanciero}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Panel - Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Proyectos por nivel de riesgo */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><PieChartIcon size={20} className="text-indigo-500" /> Proyectos por Nivel de Riesgo</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analysis.riskData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analysis.riskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`${value} Proyectos`, 'Cantidad']} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribución de estados */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-indigo-500" /> Distribución de Estados</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.stateDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                          <RechartsTooltip formatter={(value) => [`${value} Proyectos`, 'Cantidad']} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Avance promedio vs tiempo */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={20} className="text-indigo-500" /> Avance Promedio vs Tiempo (Vigencia)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.timeProgress} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${value}%`} />
                          <RechartsTooltip formatter={(value) => [`${value}%`, 'Avance']} />
                          <Legend />
                          <Bar dataKey="Programado" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Físico" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top departamentos con mayor retraso */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-rose-500" /> Top Departamentos con Mayor Retraso</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.deptDelay} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                          <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                          <RechartsTooltip formatter={(value) => [`${value}%`, 'Retraso Promedio']} />
                          <Bar dataKey="retrasoPromedio" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top líneas de inversión con mejor ejecución */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Target size={20} className="text-emerald-500" /> Top Líneas de Inversión con Mejor Ejecución</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.lineExecution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} />
                          <YAxis tickFormatter={(value) => `${value}%`} />
                          <RechartsTooltip formatter={(value) => [`${value}%`, 'Avance Promedio']} labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label} />
                          <Bar dataKey="avancePromedio" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top 10 Critical & Best Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-rose-500" /> Top 10 Proyectos Críticos</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-3 font-semibold">ID</th>
                            <th className="pb-3 font-semibold">Nombre</th>
                            <th className="pb-3 font-semibold text-right">Atraso</th>
                            <th className="pb-3 font-semibold text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.topCritical.map(p => {
                            const delay = p.project.avanceProgramado - p.project.avanceFisico;
                            return (
                              <tr key={p.project.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 font-mono font-bold text-indigo-600 cursor-pointer" onClick={() => onSelectProject(p)}>{p.project.id}</td>
                                <td className="py-3 truncate max-w-[200px] font-medium text-slate-700 cursor-pointer" title={p.project.nombre} onClick={() => onSelectProject(p)}>{p.project.nombre}</td>
                                <td className="py-3 text-right font-black text-rose-600">{delay > 0 ? `${delay}%` : 'N/A'}</td>
                                <td className="py-3 text-right">
                                  <button onClick={() => handleGenerateProjectReport(p)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Generar Informe del Proyecto">
                                    <FileText size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {analysis.topCritical.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-500 font-medium">No hay proyectos críticos.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Trophy size={20} className="text-emerald-500" /> Proyectos con Mejor Desempeño</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-3 font-semibold">ID</th>
                            <th className="pb-3 font-semibold">Nombre</th>
                            <th className="pb-3 font-semibold text-right">Avance</th>
                            <th className="pb-3 font-semibold text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.bestPerformers.map(p => (
                            <tr key={p.project.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-mono font-bold text-indigo-600 cursor-pointer" onClick={() => onSelectProject(p)}>{p.project.id}</td>
                              <td className="py-3 truncate max-w-[200px] font-medium text-slate-700 cursor-pointer" title={p.project.nombre} onClick={() => onSelectProject(p)}>{p.project.nombre}</td>
                              <td className="py-3 text-right font-black text-emerald-600">{p.project.avanceFisico}%</td>
                              <td className="py-3 text-right">
                                <button onClick={() => handleGenerateProjectReport(p)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Generar Informe del Proyecto">
                                  <FileText size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {analysis.bestPerformers.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-500 font-medium">No hay proyectos estables en ejecución.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones Inteligentes (Explicabilidad) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Lightbulb size={20} className="text-amber-500" /> Recomendaciones Inteligentes y Explicabilidad</h3>
                  
                  <div className="space-y-6">
                    {/* Portfolio Level */}
                    {analysis.portfolioRecommendations.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">A Nivel Portafolio</h4>
                        {analysis.portfolioRecommendations.map(rec => {
                          const status = userDecisions[rec.id] || 'pending';
                          return (
                            <div key={rec.id} className={`p-4 rounded-xl border ${status === 'validated' ? 'bg-emerald-50 border-emerald-200' : status === 'ignored' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-indigo-50 border-indigo-100'} transition-all`}>
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">General</span>
                                    <h5 className="font-bold text-slate-800">{rec.action}</h5>
                                  </div>
                                  <div className="bg-white/60 p-3 rounded-lg border border-white/40 mb-3">
                                    <div className="flex items-start gap-2 text-sm text-slate-700">
                                      <Info size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-semibold block mb-1">¿Por qué el sistema llegó a esta conclusión?</span>
                                        {rec.reasoning}
                                      </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {rec.dataPoints.map((dp, i) => (
                                        <span key={i} className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono text-slate-600">{dp}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {rec.relatedTo.map((rel, i) => (
                                      <span key={i} className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded-full flex items-center gap-1">
                                        {rel === 'presupuesto' ? <DollarSign size={12} /> : rel === 'comisiones' ? <Users size={12} /> : <Briefcase size={12} />}
                                        {rel}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex md:flex-col gap-2 shrink-0">
                                  <button onClick={() => handleDecision(rec.id, 'validated')} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'validated' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}>
                                    <ThumbsUp size={16} /> Validar
                                  </button>
                                  <button onClick={() => handleDecision(rec.id, 'ignored')} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'ignored' ? 'bg-slate-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                                    <ThumbsDown size={16} /> Ignorar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Project Level */}
                    {analysis.projectRecommendations.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">A Nivel Proyecto (Críticos)</h4>
                        {analysis.projectRecommendations.map(rec => {
                          const status = userDecisions[rec.id] || 'pending';
                          return (
                            <div key={rec.id} className={`p-4 rounded-xl border ${status === 'validated' ? 'bg-emerald-50 border-emerald-200' : status === 'ignored' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-rose-50 border-rose-100'} transition-all`}>
                              <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{rec.projectId}</span>
                                    <h5 className="font-bold text-slate-800">{rec.action}</h5>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-3 font-medium">{rec.projectName}</p>
                                  <div className="bg-white/60 p-3 rounded-lg border border-white/40 mb-3">
                                    <div className="flex items-start gap-2 text-sm text-slate-700">
                                      <Info size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                      <div>
                                        <span className="font-semibold block mb-1">¿Por qué el sistema llegó a esta conclusión?</span>
                                        {rec.reasoning}
                                      </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {rec.dataPoints.map((dp, i) => (
                                        <span key={i} className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono text-slate-600">{dp}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {rec.relatedTo.map((rel, i) => (
                                      <span key={i} className="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded-full flex items-center gap-1">
                                        {rel === 'presupuesto' ? <DollarSign size={12} /> : rel === 'comisiones' ? <Users size={12} /> : <Briefcase size={12} />}
                                        {rel}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex md:flex-col gap-2 shrink-0">
                                  <button onClick={() => handleDecision(rec.id, 'validated')} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'validated' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}>
                                    <ThumbsUp size={16} /> Validar
                                  </button>
                                  <button onClick={() => handleDecision(rec.id, 'ignored')} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${status === 'ignored' ? 'bg-slate-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                                    <ThumbsDown size={16} /> Ignorar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </>
            );
          })()}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">¿Borrar Proyecto?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que deseas borrar este proyecto? Esta acción es irreversible y eliminará todos los datos asociados.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteProject(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Sí, borrar proyecto
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
