import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ProjectData, DepartmentRisk, Threat, ExternalDataset, HistoricalEvent, DocumentType, ProjectDocument } from '../types';
import { colombiaData } from '../data/colombiaData';
import { AlertTriangle, TrendingUp, Target, ShieldAlert, ChevronRight, Info, BarChart3, Bot, MapPin, Map as MapIcon, Sparkles, ShieldCheck, Activity, FileText, Database, Upload, Search, Thermometer, History, Crosshair, AlertOctagon, X, CheckCircle } from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { analyzeExternalDataset } from '../services/ExternalDatasetIntelligenceService';
import { uploadDocumentToStorage } from '../lib/storage';
import { normalizeString, getOfficialDeptName } from '../lib/stringUtils';

import { StrategicAssistant } from './StrategicAssistant';

const geoUrl = "https://code.highcharts.com/mapdata/countries/co/co-all.topo.json";

// Mapping Highcharts hc-key to our department names
const deptMapping: Record<string, string> = {
  "co-sa": "San Andrés y Providencia",
  "co-ca": "Cauca",
  "co-na": "Nariño",
  "co-ch": "Chocó",
  "co-to": "Tolima",
  "co-cq": "Caquetá",
  "co-hu": "Huila",
  "co-pu": "Putumayo",
  "co-am": "Amazonas",
  "co-bl": "Bolívar",
  "co-vc": "Valle del Cauca",
  "co-su": "Sucre",
  "co-at": "Atlántico",
  "co-ce": "Cesar",
  "co-lg": "La Guajira",
  "co-ma": "Magdalena",
  "co-ar": "Arauca",
  "co-ns": "Norte de Santander",
  "co-cs": "Casanare",
  "co-gv": "Guaviare",
  "co-me": "Meta",
  "co-vp": "Vaupés",
  "co-vd": "Vichada",
  "co-an": "Antioquia",
  "co-co": "Córdoba",
  "co-by": "Boyacá",
  "co-st": "Santander",
  "co-cl": "Caldas",
  "co-cu": "Cundinamarca",
  "co-1136": "Bogotá D.C.",
  "co-ri": "Risaralda",
  "co-qd": "Quindío",
  "co-gn": "Guainía"
};

// Normalized department coordinates
const departmentCoordinates: Record<string, [number, number]> = {
  "amazonas": [-71.5, -1.5],
  "antioquia": [-75.5, 7.0],
  "arauca": [-71.0, 7.0],
  "atlantico": [-74.9, 10.7],
  "bolivar": [-74.5, 9.0],
  "boyaca": [-73.0, 5.5],
  "caldas": [-75.4, 5.3],
  "caqueta": [-74.0, 1.0],
  "casanare": [-71.5, 5.5],
  "cauca": [-76.8, 2.5],
  "cesar": [-73.5, 9.5],
  "choco": [-76.8, 6.0],
  "cordoba": [-75.8, 8.5],
  "cundinamarca": [-74.2, 4.8],
  "guainia": [-68.5, 2.5],
  "guaviare": [-72.5, 2.5],
  "huila": [-75.7, 2.5],
  "la guajira": [-72.5, 11.5],
  "magdalena": [-74.2, 10.0],
  "meta": [-73.0, 3.5],
  "narino": [-77.5, 1.5],
  "norte de santander": [-72.8, 8.0],
  "putumayo": [-76.0, 0.5],
  "quindio": [-75.7, 4.5],
  "risaralda": [-75.9, 5.0],
  "san andres y providencia": [-78.5, 10.5],
  "santander": [-73.5, 7.0],
  "sucre": [-75.2, 9.0],
  "tolima": [-75.2, 4.0],
  "valle del cauca": [-76.5, 3.8],
  "vaupes": [-70.5, 0.5],
  "vichada": [-69.5, 4.5],
  "bogota d.c.": [-74.08, 4.6]
};

interface ColombiaMapProps {
  projects: ProjectData[];
  departmentsData: DepartmentRisk[];
  threats: Threat[];
  onOpenPanel: (dept: string) => void;
  onSelectProject: (project: ProjectData) => void;
}

export const ColombiaMap: React.FC<ColombiaMapProps> = ({ projects, departmentsData, threats, onOpenPanel, onSelectProject }) => {
  const { state, addExternalDataset, addDocument } = useProject();
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [showStrategicAssistant, setShowStrategicAssistant] = useState(false);
  const [isRiskMode, setIsRiskMode] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDept, setUploadDept] = useState<string>('');
  const [uploadMuni, setUploadMuni] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<DocumentType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Calculate risk and investment per municipality
  const muniStats = useMemo(() => {
    const stats: Record<string, { risk: 'Alto' | 'Medio' | 'Bajo' | null; investment: number }> = {};
    
    // Initialize stats for all municipalities
    state.municipios.forEach(m => {
      stats[m.id] = { risk: null, investment: 0 };
    });

    // Aggregate risk
    state.riesgosTerritoriales.forEach(r => {
      if (stats[r.municipioId]) {
        // Simple aggregation: if any risk is 'alto', it's 'alto'.
        if (r.impacto === 'alto') stats[r.municipioId].risk = 'Alto';
        else if (r.impacto === 'medio' && stats[r.municipioId].risk !== 'Alto') stats[r.municipioId].risk = 'Medio';
        else if (r.impacto === 'bajo' && !stats[r.municipioId].risk) stats[r.municipioId].risk = 'Bajo';
      }
    });

    // Aggregate investment
    projects.forEach(p => {
      // Need to map project.municipio (name) to municipioId
      const muni = state.municipios.find(m => normalizeString(m.nombre) === normalizeString(p.project.municipio || ''));
      if (muni) {
        stats[muni.id].investment += p.presupuesto.valorTotal;
      }
    });
    
    return stats;
  }, [projects, state.riesgosTerritoriales, state.municipios]);

  // Aggregate muniStats to deptStats for map rendering
  const deptStats = useMemo(() => {
    const stats: Record<string, { 
      investment: number, 
      count: number, 
      contracts: number,
      population: number,
      density: number,
      extension: number,
      riskIndex: number,
      disasterScore: number
    }> = {};

    // Initialize stats for all departments
    colombiaData.forEach(d => {
      const officialName = getOfficialDeptName(d.name);
      const deptRisk = departmentsData.find(dr => getOfficialDeptName(dr.name) === officialName);
      stats[officialName] = { 
        investment: deptRisk?.investment || 0, 
        count: 0, 
        contracts: 0,
        population: deptRisk?.population || 0,
        density: deptRisk?.density || 0,
        extension: deptRisk?.extension || 0,
        riskIndex: deptRisk?.riskIndex || 0,
        disasterScore: deptRisk?.disasterHistoryScore || 0
      };
    });
    
    // Aggregate investment directly from projects for robustness
    if (projects.length > 0) {
      const projectInvestmentByDept: Record<string, number> = {};
      const projectCountByDept: Record<string, number> = {};

      projects.forEach(p => {
        const deptName = getOfficialDeptName(p.project.departamento || '');
        projectInvestmentByDept[deptName] = (projectInvestmentByDept[deptName] || 0) + (p.presupuesto?.valorTotal || 0);
        projectCountByDept[deptName] = (projectCountByDept[deptName] || 0) + 1;
      });

      Object.keys(projectCountByDept).forEach(deptName => {
        if (stats[deptName]) {
          // If we have project-specific investment, use it. 
          // Otherwise, keep the department-level investment from departmentsData
          if (projectInvestmentByDept[deptName] > 0) {
            stats[deptName].investment = projectInvestmentByDept[deptName];
          }
          stats[deptName].contracts = projectCountByDept[deptName];
          stats[deptName].count = 1;
        }
      });
    }
    
    // Include external datasets in the count to highlight departments with territorial info
    state.externalDatasets.forEach(ds => {
      const deptName = getOfficialDeptName(ds.departamento);
      if (stats[deptName]) {
        if (stats[deptName].count === 0) stats[deptName].count = 1;
      }
    });

    // Include documents in the count
    state.documentos.forEach(doc => {
      if (doc.department) {
        const deptName = getOfficialDeptName(doc.department);
        if (stats[deptName]) {
          if (stats[deptName].count === 0) stats[deptName].count = 1;
        }
      }
    });

    return stats;
  }, [projects, state.departamentos, state.externalDatasets, state.documentos, departmentsData]);

  const maxProjects = useMemo(() => {
    const max = Math.max(...Object.values(deptStats).map(s => s.contracts || 0));
    return max > 0 ? max : 1;
  }, [deptStats]);

  // Detect critical municipalities
  const criticalMunicipalities = useMemo(() => {
    const avgInvestment = Object.values(muniStats).reduce((sum, s) => sum + s.investment, 0) / Object.keys(muniStats).length;
    return Object.entries(muniStats)
      .filter(([id, s]) => s.risk === 'Alto' && s.investment < avgInvestment)
      .map(([id, s]) => ({ ...s, id, nombre: state.municipios.find(m => m.id === id)?.nombre || 'Desconocido' }));
  }, [muniStats, state.municipios]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadDept || !uploadCategory) {
      alert("Por favor seleccione departamento y categoría antes de subir el archivo.");
      return;
    }

    setIsUploading(true);
    
    try {
      let fileUrl = '';
      
      try {
        const folderPath = `territorial/${uploadDept}`;
        fileUrl = await uploadDocumentToStorage(file, folderPath);
      } catch (error) {
        console.error("Error uploading to Supabase:", error);
        throw new Error("No se pudo subir el documento a Supabase. Verifique su conexión o configuración.");
      }

      // 1. Analyze with AI
      const analysis = await analyzeExternalDataset(file);
      const newDataset: ExternalDataset = {
        id: `ds-${Date.now()}`,
        ...analysis,
        departamento: uploadDept || analysis.departamento,
        municipio: uploadMuni || analysis.municipio,
        fuente: (uploadCategory === 'POD' || uploadCategory === 'POT') ? uploadCategory : (analysis.fuente as any)
      };
      addExternalDataset(newDataset);

      // 2. Add to Document Repository
      addDocument({
        id: `DOC-${Date.now()}`,
        titulo: file.name,
        tipo: uploadCategory as DocumentType,
        department: uploadDept,
        municipio: uploadMuni,
        descripcion: `Dataset territorial analizado por IA. Hallazgos: ${analysis.hallazgosClave.join(', ')}`,
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        estado: 'Aprobado',
        tags: ['Territorial', uploadDept, uploadCategory, analysis.fuente],
        versiones: [{
          id: `V1-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: fileUrl,
          nombreArchivo: file.name,
          subidoPor: 'Usuario Actual',
          accion: 'Subida',
          estado: 'Aprobado'
        }]
      });

      alert("Documento cargado, analizado y guardado en el repositorio exitosamente.");
    } catch (error) {
      console.error("Error analyzing external dataset:", error);
      alert("Hubo un error al procesar el documento. Por favor, intente nuevamente.");
    } finally {
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setUploadDept('');
      setUploadCategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const coverageData = useMemo(() => {
    let totalThreats = 0;
    let mitigatedThreats = 0;
    const unmitigatedList: { dept: string; threatName: string; threatId: string }[] = [];
    const inconsistencies: { projectId: string; projectName: string; dept: string; muni: string; issue: string }[] = [];

    const deptsToProcess = selectedDept 
      ? departmentsData.filter(d => getOfficialDeptName(d.name) === getOfficialDeptName(selectedDept))
      : departmentsData;

    deptsToProcess.forEach(dept => {
      const deptProjects = projects.filter(p => getOfficialDeptName(p.project.departamento) === getOfficialDeptName(dept.name));
      
      dept.threats.forEach(threatId => {
        totalThreats++;
        const threat = threats.find(t => t.id === threatId);
        const threatName = threat ? threat.name : threatId;
        
        const isMitigated = deptProjects.some(p => 
          p.project.riesgosMitigados?.includes(threatName) || 
          (p.project.nombre || '').toLowerCase().includes((threatName || '').toLowerCase()) ||
          (p.project.objetivoGeneral || '').toLowerCase().includes((threatName || '').toLowerCase())
        );

        if (isMitigated) {
          mitigatedThreats++;
        } else {
          unmitigatedList.push({ dept: dept.name, threatName, threatId });
        }
      });

      // Simple mock logic for POT inconsistencies
      deptProjects.forEach(p => {
        if (p.project.municipio === 'Quibdó' && (p.project.nombre || '').toLowerCase().includes('construcción') && (p.project.nombre || '').toLowerCase().includes('río')) {
          inconsistencies.push({
            projectId: p.project.id,
            projectName: p.project.nombre,
            dept: p.project.departamento,
            muni: p.project.municipio,
            issue: 'Conflicto con POT Quibdó: Prohibición de construcción en ronda del río.'
          });
        }
      });
    });

    const coveragePercentage = totalThreats > 0 ? Math.round((mitigatedThreats / totalThreats) * 100) : 0;
    const totalExposedPopulation = deptsToProcess.reduce((sum, d) => sum + d.population, 0);

    return {
      coveragePercentage,
      unmitigatedList,
      inconsistencies,
      totalExposedPopulation
    };
  }, [projects, departmentsData, threats, selectedDept]);

  const filteredEvents = (state.historicalEvents || []).filter(e => {
    const matchesSearch = (e.departamento || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (e.municipio || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (e.tipoAmenaza || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    
    if (!selectedDept) return matchesSearch;
    
    return matchesSearch && getOfficialDeptName(e.departamento) === getOfficialDeptName(selectedDept);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Ejecución': return '#3b82f6'; // blue-500
      case 'Terminado': return '#10b981'; // emerald-500
      case 'Suspendido': return '#f59e0b'; // amber-500
      default: return '#64748b'; // slate-500
    }
  };

  const currentDeptData = useMemo(() => {
    if (!selectedDept) {
      // National summary
      const totalInv = projects.reduce((sum, p) => sum + p.presupuesto.valorTotal, 0);
      const totalProjects = projects.length;
      const allAlerts = projects.flatMap(p => p.alerts);
      const activeAlerts = allAlerts.filter(a => a.estado === 'Abierta');
      const avgProgress = projects.reduce((sum, p) => sum + p.project.avanceFisico, 0) / (projects.length || 1);

      return {
        name: "Resumen Nacional",
        investment: totalInv,
        count: totalProjects,
        progress: avgProgress,
        alerts: activeAlerts,
        priorities: [
          "Aceleración de proyectos con rezago > 10%",
          "Gestión de suspensiones en infraestructura vial",
          "Cierre financiero de proyectos terminados"
        ],
        recommendations: [
          "Reforzar supervisión en zonas con alertas críticas",
          "Actualizar cronogramas de proyectos suspendidos",
          "Optimizar flujo de pagos para contratistas al día"
        ]
      };
    }

    const officialSelectedDept = getOfficialDeptName(selectedDept);
    const deptProjects = projects.filter(p => getOfficialDeptName(p.project.departamento) === officialSelectedDept);
    const totalInv = deptProjects.reduce((sum, p) => sum + p.presupuesto.valorTotal, 0);
    const avgProgress = deptProjects.reduce((sum, p) => sum + p.project.avanceFisico, 0) / (deptProjects.length || 1);
    const deptAlerts = deptProjects.flatMap(p => p.alerts).filter(a => a.estado === 'Abierta');

    // Simple logic for priorities and recommendations based on data
    const delayed = deptProjects.filter(p => p.project.avanceFisico < p.project.avanceProgramado - 5);
    
    const priorities = [];
    if (delayed.length > 0) priorities.push(`Atención a ${delayed.length} proyectos con retraso`);
    if (deptAlerts.length > 3) priorities.push("Mitigación de alertas críticas");
    priorities.push("Seguimiento a ejecución presupuestal");

    const recommendations = [];
    if (delayed.length > 0) recommendations.push("Solicitar plan de choque a contratistas con retraso");
    if (deptAlerts.length > 0) recommendations.push("Mesa técnica para resolución de alertas");
    recommendations.push("Visita técnica de verificación en campo");

    return {
      name: selectedDept,
      investment: totalInv,
      count: deptProjects.length,
      progress: avgProgress,
      alerts: deptAlerts,
      priorities,
      recommendations
    };
  }, [selectedDept, projects]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="relative w-full h-full bg-white rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 overflow-hidden">
      {showStrategicAssistant && (
        <StrategicAssistant 
          projects={projects} 
          onClose={() => setShowStrategicAssistant(false)} 
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapIcon className="text-indigo-600" />
              {isRiskMode ? 'Mapa de Riesgo Territorial' : 'Mapa de Proyectos en Ejecución'}
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setIsRiskMode(false)}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${!isRiskMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Proyectos
              </button>
              <button
                onClick={() => setIsRiskMode(true)}
                className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1 ${isRiskMode ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <AlertTriangle size={14} /> Riesgo
              </button>
            </div>
            {!isRiskMode && (
              <button
                onClick={() => setShowStrategicAssistant(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 animate-pulse"
              >
                <Bot size={18} />
                Asistente Estratégico IA
              </button>
            )}
            {isRiskMode && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm font-bold"
              >
                <Upload size={16} />
                Cargar Dataset (IDEAM/POT)
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!isRiskMode ? (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600">
                <span className="mr-1">Proyectos:</span>
                <div className="w-3 h-3 rounded-full bg-emerald-100"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-300"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-700"></div>
                <span className="ml-1 text-xs">(Menor a Mayor)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span>Riesgo Alto</span>
                <div className="w-3 h-3 rounded-full bg-amber-500 ml-2"></div>
                <span>Medio</span>
                <div className="w-3 h-3 rounded-full bg-emerald-500 ml-2"></div>
                <span>Bajo</span>
              </div>
            )}
            {selectedDept && (
              <button 
                onClick={() => setSelectedDept(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Ver Resumen Nacional <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden bg-slate-50 rounded-lg border border-slate-100">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1800, center: [-74, 4.5] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup center={[-74, 4.5]} zoom={1} maxZoom={5}>
            <Geographies geography={geoUrl}>
              {({ geographies }) => {
                // Transform San Andrés to be visible and integrated
                const transformedGeographies = geographies.map(geo => {
                  if (geo.properties["hc-key"] !== "co-sa") return geo;
                  
                  const shiftedGeo = JSON.parse(JSON.stringify(geo));
                  const centerLng = -81.7;
                  const centerLat = 12.5;
                  const scaleFactor = 8.0; // Increased scale factor for better visibility
                  const targetLng = -78.5;
                  const targetLat = 10.5;
                  
                  const transform = (coords: any): any => {
                    if (typeof coords[0] === 'number') {
                      const relLng = coords[0] - centerLng;
                      const relLat = coords[1] - centerLat;
                      return [
                        targetLng + (relLng * scaleFactor),
                        targetLat + (relLat * scaleFactor)
                      ];
                    }
                    return coords.map(transform);
                  };
                  
                  shiftedGeo.geometry.coordinates = transform(shiftedGeo.geometry.coordinates);
                  return shiftedGeo;
                });

                return transformedGeographies.map(geo => {
                  const hcKey = geo.properties["hc-key"];
                  const deptName = deptMapping[hcKey] || geo.properties.name;
                  const officialDeptName = getOfficialDeptName(deptName);
                  const stats = deptStats[officialDeptName] || { investment: 0, count: 0, contracts: 0 };

                  const deptRisk = departmentsData.find(d => getOfficialDeptName(d.name) === officialDeptName);
                  const isHighRisk = deptRisk && deptRisk.riskIndex >= 80;
                  const isMediumRisk = deptRisk && deptRisk.riskIndex >= 50 && deptRisk.riskIndex < 80;
                  
                  const hasKnowledge = state.conocimientoTerritorial?.some(c => 
                    getOfficialDeptName(c.departamento) === officialDeptName && 
                    c.documentosAnalizados && c.documentosAnalizados.length > 0
                  );

                  const projectCount = stats.contracts || 0;
                  let projectColor = "#e5e7eb"; // gray-200 (default, no data)
                  
                  if (projectCount > 0) {
                    const intensity = projectCount / maxProjects;
                    if (intensity > 0.8) projectColor = "#047857"; // emerald-700
                    else if (intensity > 0.6) projectColor = "#059669"; // emerald-600
                    else if (intensity > 0.4) projectColor = "#10b981"; // emerald-500
                    else if (intensity > 0.2) projectColor = "#34d399"; // emerald-400
                    else projectColor = "#6ee7b7"; // emerald-300
                  }

                  const fill = isRiskMode 
                    ? (isHighRisk ? "#f43f5e" : isMediumRisk ? "#f59e0b" : "#10b981") // rose-500, amber-500, emerald-500
                    : projectColor;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#6366f1", outline: "none", cursor: "pointer" },
                      }}
                      onClick={() => {
                        setSelectedItem(null);
                        setSelectedDept(deptName);
                        // onOpenPanel(deptName); // Don't open panel automatically, let user click "Ver Panel Territorial"
                      }}
                      onMouseEnter={() => setHoveredItem({ type: 'dept', name: deptName, ...stats, riskIndex: deptRisk?.riskIndex, population: deptRisk?.population || 0, extension: deptRisk?.extension || 0, disasterScore: deptRisk?.disasterHistoryScore || 0 })}
                      onMouseLeave={() => setHoveredItem(null)}
                    />
                  );
                });
              }}
            </Geographies>

            {/* Project Markers */}
            {projects.map(p => {
              const dept = getOfficialDeptName(p.project.departamento);
              const baseCoords = departmentCoordinates[dept] || [-74, 4.5];
              
              // Add a small deterministic offset based on project ID to avoid overlap
              const hash = p.project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const offsetX = (hash % 10 - 5) * 0.05;
              const offsetY = (hash % 7 - 3) * 0.05;
              const coords: [number, number] = [baseCoords[0] + offsetX, baseCoords[1] + offsetY];
              
              return (
                <Marker 
                  key={p.project.id} 
                  coordinates={coords} 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedItem({ type: 'project', ...p });
                  }}
                >
                  <circle 
                    r={8} 
                    fill={getStatusColor(p.project.estado)} 
                    stroke="#fff" 
                    strokeWidth={1.5}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </Marker>
              );
            })}

            {/* Alert Markers */}
            {projects.flatMap(p => p.alerts.map(a => ({ ...a, project: p.project }))).map((a, i) => {
              const dept = getOfficialDeptName(a.project.departamento);
              const baseCoords = departmentCoordinates[dept] || [-74, 4.5];
              const hash = a.project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const offsetX = (hash % 10 - 5) * 0.05;
              const offsetY = (hash % 7 - 3) * 0.05 + 0.15; // Offset slightly from the project marker
              
              return (
                <Marker key={i} coordinates={[baseCoords[0] + offsetX, baseCoords[1] + offsetY]}>
                  <text y="-5" textAnchor="middle" className="text-[10px] fill-rose-600 font-bold pointer-events-none">!</text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {hoveredItem && (
          <div className="absolute top-4 right-4 bg-slate-900/95 text-white p-5 rounded-2xl shadow-2xl w-80 z-10 pointer-events-none border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl leading-tight">{hoveredItem.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Información Territorial</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                hoveredItem.riskIndex >= 70 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                hoveredItem.riskIndex >= 40 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                Riesgo {hoveredItem.riskIndex >= 70 ? 'Alto' : hoveredItem.riskIndex >= 40 ? 'Medio' : 'Bajo'}
              </div>
            </div>

            <div className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Inversión</p>
                  </div>
                  <p className="text-sm font-bold text-indigo-300">{formatCurrency(hoveredItem.investment)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Proyectos</p>
                  </div>
                  <p className="text-sm font-bold">{hoveredItem.contracts} activos</p>
                </div>
              </div>

              {/* Demographic Info */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Población</p>
                    <p className="text-sm font-bold">{hoveredItem.population.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">hab.</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Extensión</p>
                    <p className="text-sm font-bold">{hoveredItem.extension?.toLocaleString() || 0} <span className="text-[10px] font-normal text-slate-500">km²</span></p>
                  </div>
                </div>
              </div>

              {/* Risk Indicators */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Índice de Riesgo</p>
                  <p className="text-xs font-bold text-slate-200">{hoveredItem.riskIndex}%</p>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      hoveredItem.riskIndex >= 70 ? 'bg-rose-500' : 
                      hoveredItem.riskIndex >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${hoveredItem.riskIndex}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-end pt-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Puntaje Desastres</p>
                  <p className="text-xs font-bold text-slate-200">{hoveredItem.disasterScore}/100</p>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${hoveredItem.disasterScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <p className="text-[9px] text-slate-500 italic text-center">Click para ver detalle territorial completo</p>
              </div>
            </div>
          </div>
        )}

        {/* Project Summary Popup */}
        {selectedItem && selectedItem.type === 'project' && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-xl w-80 z-20 border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-lg mb-2">{selectedItem.project.nombre}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Municipio:</span>
                <span className="font-medium">{selectedItem.project.municipio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avance:</span>
                <span className={`font-bold ${selectedItem.project.avanceFisico < selectedItem.project.avanceProgramado - 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedItem.project.avanceFisico}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inversión:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(selectedItem?.project?.presupuesto?.valorTotal || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Alertas Críticas:</span>
                <div className="mt-1 space-y-2">
                  {selectedItem.project.alerts?.filter(a => a.estado === 'Abierta').slice(0, 3).map((a, i) => (
                    <div key={i} className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[11px]">
                      <p className="font-bold mb-0.5">{a.nivel} - {a.fecha}</p>
                      <p className="opacity-90">{a.descripcion}</p>
                      {a.recomendacionIA && (
                        <div className="mt-2 pt-2 border-t border-rose-200">
                          <p className="font-bold text-indigo-700 flex items-center gap-1">
                            <Sparkles size={10} /> Recomendación IA:
                          </p>
                          <p className="text-indigo-900 italic">{a.recomendacionIA}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedItem.project.alerts?.filter(a => a.estado === 'Abierta').length === 0 && (
                    <div className="text-xs text-emerald-600 font-medium">Sin alertas críticas</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <button 
                onClick={() => onSelectProject(selectedItem)}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Ver Panel Completo
              </button>
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full text-slate-500 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Sidebar with Indicators, Priorities, Alerts, Recommendations */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
        {!isRiskMode ? (
          <>
            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-indigo-400 uppercase tracking-wider text-xs flex items-center gap-2">
                  <BarChart3 size={16} />
                  Indicadores: {currentDeptData.name}
                </h3>
                {selectedDept && (
                  <button 
                    onClick={() => onOpenPanel(selectedDept)}
                    className="p-1.5 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Ver Panel Territorial Completo"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Inversión</p>
                  <p className="text-sm font-bold truncate">{formatCurrency(currentDeptData.investment)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Proyectos</p>
                  <p className="text-sm font-bold">{currentDeptData.count}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Avance Prom.</p>
                  <p className="text-sm font-bold">{currentDeptData.progress.toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Alertas Act.</p>
                  <p className={`text-sm font-bold ${currentDeptData.alerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {currentDeptData.alerts.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Priorities */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Target size={18} className="text-indigo-600" />
                Prioridades Territoriales
              </h3>
              <div className="space-y-2">
                {currentDeptData.priorities.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                Alertas Críticas
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {currentDeptData.alerts.length > 0 ? (
                  currentDeptData.alerts.map((a, i) => (
                    <div key={i} className="text-xs p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-800">
                      <p className="font-bold mb-0.5">{a.nivel} - {a.fecha}</p>
                      <p className="opacity-90">{a.descripcion}</p>
                      {a.recomendacionIA && (
                        <div className="mt-2 pt-2 border-t border-rose-200">
                          <p className="font-bold text-indigo-700 flex items-center gap-1">
                            <Sparkles size={12} /> Sugerencia IA:
                          </p>
                          <p className="text-indigo-900 italic">{a.recomendacionIA}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 flex items-center gap-2">
                    <ShieldAlert size={14} />
                    No hay alertas activas
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-indigo-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Bot size={80} />
              </div>
              <h3 className="font-bold text-indigo-300 text-xs uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                <Bot size={18} />
                Recomendaciones IA
              </h3>
              <div className="space-y-2 relative z-10">
                {currentDeptData.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-indigo-100/90 leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
              <h3 className="font-bold text-indigo-400 uppercase tracking-wider text-xs flex items-center gap-2 mb-4">
                <Activity size={16} />
                Indicadores de Riesgo: {selectedDept || 'Nacional'}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cobertura de Mitigación</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-black text-white">{coverageData.coveragePercentage}%</h3>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${coverageData.coveragePercentage > 70 ? 'bg-emerald-500' : coverageData.coveragePercentage > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${coverageData.coveragePercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Riesgos NO Mitigados</p>
                    <p className="text-xl font-bold text-rose-400">{coverageData.unmitigatedList.length}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Pob. Expuesta</p>
                    <p className="text-xl font-bold text-white">{(coverageData.totalExposedPopulation / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Riesgos NO Mitigados List */}
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl">
              <h3 className="font-bold text-rose-900 text-sm mb-3 flex items-center gap-2">
                <AlertOctagon size={18} className="text-rose-600" />
                Riesgos NO Mitigados
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {coverageData.unmitigatedList.length > 0 ? coverageData.unmitigatedList.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-rose-200 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-xs">{item.dept}</span>
                      <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">{item.threatName}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                    <ShieldCheck className="mx-auto text-emerald-500 mb-1" size={16} />
                    <p className="text-xs font-medium text-emerald-700">Todos los riesgos mitigados.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inconsistencias POT */}
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
              <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                Inconsistencias POT
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {coverageData.inconsistencies.length > 0 ? coverageData.inconsistencies.map((inc, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-amber-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-800 mb-1 truncate">{inc.projectName}</p>
                    <div className="bg-amber-100 text-amber-800 text-[10px] p-1.5 rounded border border-amber-200">
                      <AlertTriangle size={10} className="inline mr-1" />
                      {inc.issue}
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500">Sin inconsistencias detectadas.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Datasets Externos */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Database size={18} className="text-indigo-600" />
                Datasets Externos
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {state.externalDatasets
                  .filter(d => !selectedDept || getOfficialDeptName(d.departamento) === getOfficialDeptName(selectedDept))
                  .map(dataset => (
                  <div key={dataset.id} className="p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] font-black text-indigo-700 uppercase bg-indigo-100 px-1.5 py-0.5 rounded">{dataset.fuente}</span>
                      <span className="text-[9px] text-slate-400">{dataset.fechaPublicacion}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs truncate">{dataset.titulo}</h4>
                  </div>
                ))}
                {(selectedDept ? state.externalDatasets.filter(d => getOfficialDeptName(d.departamento) === getOfficialDeptName(selectedDept)).length : state.externalDatasets.length) === 0 && (
                  <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">No hay datasets cargados.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Hallazgos de IA (Datasets) */}
            {selectedDept && state.externalDatasets.some(d => getOfficialDeptName(d.departamento) === getOfficialDeptName(selectedDept)) && (
              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl">
                <h3 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-600" />
                  Hallazgos de IA (Datasets)
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {state.externalDatasets
                    .filter(d => getOfficialDeptName(d.departamento) === getOfficialDeptName(selectedDept))
                    .map(dataset => (
                      <div key={dataset.id} className="space-y-1.5">
                        <p className="text-[10px] font-bold text-indigo-700 uppercase">{dataset.titulo}</p>
                        <div className="space-y-1">
                          {dataset.hallazgosClave.map((hallazgo, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-2 text-[11px] text-slate-700 leading-tight">
                              <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                              {hallazgo}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Histórico de Eventos */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                Histórico de Eventos
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {filteredEvents.map(event => (
                  <div key={event.id} className="p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-800">{event.municipio}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        event.magnitud === 'Catastrófica' ? 'bg-rose-100 text-rose-700' :
                        event.magnitud === 'Grave' ? 'bg-orange-100 text-orange-700' :
                        event.magnitud === 'Moderada' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {event.magnitud}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mb-1">{event.tipoAmenaza} - {new Date(event.fecha).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-500">{event.poblacionAfectada.toLocaleString()} afectados</p>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500">No se encontraron eventos.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Upload className="text-indigo-600" />
                Cargar Dataset Externo
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">
                Sube documentos del IDEAM, Planes de Ordenamiento Territorial (POT) o estudios técnicos para enriquecer el análisis de riesgo.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={uploadDept}
                    onChange={(e) => setUploadDept(e.target.value)}
                    disabled={isUploading}
                  >
                    <option value="">Seleccionar departamento...</option>
                    {departmentsData.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    <option value="Nacional">Nacional (Todo el país)</option>
                  </select>
                </div>
                {uploadDept && uploadDept !== 'Nacional' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Municipio (Opcional)</label>
                    <select 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      value={uploadMuni}
                      onChange={(e) => setUploadMuni(e.target.value)}
                      disabled={isUploading}
                    >
                      <option value="">Seleccionar municipio...</option>
                      {colombiaData.find(d => d.name === uploadDept)?.municipalities.map((m, index) => (
                        <option key={`${m}-${index}`} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría del Documento</label>
                  <select 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as DocumentType)}
                    disabled={isUploading}
                  >
                    <option value="">Seleccionar categoría...</option>
                    <option value="POT">Plan de Ordenamiento Territorial (POT)</option>
                    <option value="POD">Plan de Ordenamiento Departamental (POD)</option>
                    <option value="Reporte IDEAM">Reporte IDEAM</option>
                    <option value="Estudio Técnico">Estudio Técnico de Riesgo</option>
                    <option value="Dataset Territorial">Dataset Territorial (CSV/Excel)</option>
                  </select>
                </div>
              </div>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isUploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer'} ${(!uploadDept || !uploadCategory) && !isUploading ? 'opacity-50 cursor-not-allowed hover:border-slate-300 hover:bg-white' : ''}`}
                onClick={() => !isUploading && uploadDept && uploadCategory && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.csv,.xlsx"
                  onChange={handleFileUpload}
                  disabled={isUploading || !uploadDept || !uploadCategory}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-medium text-indigo-700">Procesando dataset con IA...</p>
                    <p className="text-xs text-indigo-500 mt-1">Extrayendo hallazgos clave y ubicaciones</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700 mb-1">Haz clic para subir un archivo</p>
                    <p className="text-xs text-slate-500">PDF, CSV o Excel (Max 50MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
