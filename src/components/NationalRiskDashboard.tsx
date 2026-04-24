import React, { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { ProjectData } from '../types';
import { ColombiaMap } from './ColombiaMap';
import { StrategicAssistant } from './StrategicAssistant';
import { MunicipalityDetailView } from './MunicipalityDetailView';
import { RiskDashboard } from './RiskDashboard';
import { Bot, Filter } from 'lucide-react';

export const NationalRiskDashboard: React.FC = () => {
  const { state, getProjectData } = useProject();
  const [selectedDept, setSelectedDept] = useState<string>('Todos');
  const [selectedLinea, setSelectedLinea] = useState<string>('Todas');
  const [selectedConvenio, setSelectedConvenio] = useState<string>('Todos');
  const [showAssistant, setShowAssistant] = useState(false);
  const [selectedMuni, setSelectedMuni] = useState<{ id: string, nombre: string } | null>(null);

  const filteredProjects = useMemo(() => {
    // Convert to ProjectData first
    const allProjectData = state.proyectos
      .map(p => getProjectData(p.id))
      .filter((p): p is ProjectData => !!p);

    let filtered = allProjectData;
    if (selectedDept !== 'Todos') filtered = filtered.filter(p => p.project.departamento === selectedDept);
    if (selectedLinea !== 'Todas') filtered = filtered.filter(p => p.project.linea === selectedLinea);
    if (selectedConvenio !== 'Todos') filtered = filtered.filter(p => p.project.convenioId === selectedConvenio);
    return filtered;
  }, [state.proyectos, selectedDept, selectedLinea, selectedConvenio, getProjectData]);

  const lineas = useMemo(() => Array.from(new Set(state.proyectos.map(p => p.linea || 'Sin línea'))), [state.proyectos]);
  const convenios = useMemo(() => state.convenios, [state.convenios]);

  // Calculate department risk data for the map
  const departmentsData = useMemo(() => {
    return state.departamentos.map(dept => {
      const deptProjects = state.proyectos.filter(p => p.departamento === dept.name);
      const deptRisks = state.riesgosTerritoriales.filter(r => {
        const muni = state.municipios.find(m => m.id === r.municipioId);
        return muni && muni.departamentoId === dept.id;
      });

      const deptKnowledge = state.conocimientoTerritorial.find(c => c.departamento === dept.name);

      // Calculate a risk index (0-100)
      const highRiskCount = deptRisks.filter(r => r.impacto === 'alto').length;
      const mediumRiskCount = deptRisks.filter(r => r.impacto === 'medio').length;
      
      let riskIndex = 0;
      if (deptRisks.length > 0) {
        riskIndex = ((highRiskCount * 100) + (mediumRiskCount * 50)) / deptRisks.length;
      } else if (deptProjects.length > 0) {
        riskIndex = 20;
      }

      return {
        id: dept.id,
        name: dept.name,
        population: deptKnowledge?.poblacionEstimada || dept.population || 1000000,
        density: dept.density || 100,
        extension: deptKnowledge?.extension || dept.extension,
        riskIndex: Math.min(100, Math.max(dept.riskIndex || 0, riskIndex)),
        threats: deptRisks.length > 0 ? deptRisks.map(r => r.id) : (dept.threats || []),
        investment: deptProjects.reduce((sum, p) => {
          const data = getProjectData(p.id);
          return sum + (data?.presupuesto.valorTotal || 0);
        }, 0) || dept.investment || 0,
        disasterHistoryScore: dept.disasterHistoryScore || 50
      };
    });
  }, [state.departamentos, state.proyectos, state.riesgosTerritoriales, state.municipios, state.conocimientoTerritorial, getProjectData]);

  // Calculate threats for the map
  const threats = useMemo(() => {
    return state.riesgosTerritoriales.map(r => {
      const muni = state.municipios.find(m => m.id === r.municipioId);
      const dept = muni ? state.departamentos.find(d => d.id === muni.departamentoId) : null;
      
      const threatNameMap: Record<string, any> = {
        'inundación': 'Inundación',
        'deslizamiento': 'Deslizamiento',
        'sismo': 'Sismo',
        'sequía': 'Sequía',
        'incendio': 'Deslizamiento',
        'otro': 'Deslizamiento'
      };

      return {
        id: r.id,
        name: threatNameMap[r.tipo_riesgo] || 'Deslizamiento',
        description: `Riesgo de ${r.tipo_riesgo} en ${muni?.nombre || 'el municipio'}`,
        level: r.impacto === 'alto' ? 'Crítico' : r.impacto === 'medio' ? 'Alto' : 'Medio',
        location: muni ? `${muni.nombre}, ${dept?.name || ''}` : 'Desconocido',
        coordinates: [0, 0] as [number, number]
      };
    });
  }, [state.riesgosTerritoriales, state.municipios, state.departamentos]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard de Riesgo Nacional</h1>
        <div className="flex gap-4">
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="border p-2 rounded-lg">
            <option value="Todos">Todos los Departamentos</option>
            {state.departamentos.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={selectedLinea} onChange={(e) => setSelectedLinea(e.target.value)} className="border p-2 rounded-lg">
            <option value="Todas">Todas las Líneas</option>
            {lineas.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={selectedConvenio} onChange={(e) => setSelectedConvenio(e.target.value)} className="border p-2 rounded-lg">
            <option value="Todos">Todos los Convenios</option>
            {convenios.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <button 
            onClick={() => setShowAssistant(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Bot size={20} /> Asistente IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <ColombiaMap 
            projects={filteredProjects}
            departmentsData={departmentsData} 
            threats={threats} 
            onOpenPanel={(dept) => setSelectedDept(dept)}
            onSelectProject={(p) => console.log(p)}
          />
        </div>
        <div className="lg:col-span-1">
          <RiskDashboard 
            projects={filteredProjects} 
            contracts={state.contratos}
            otrosies={state.otrosies}
            pagos={state.pagos}
            reports={state.informesInterventoria}
          />
        </div>
      </div>

      {showAssistant && (
        <StrategicAssistant 
          projects={filteredProjects} 
          onClose={() => setShowAssistant(false)} 
        />
      )}

      {selectedMuni && (
        <MunicipalityDetailView 
          municipioId={selectedMuni.id}
          municipioNombre={selectedMuni.nombre}
          projects={filteredProjects}
          riesgos={state.riesgosTerritoriales}
          onClose={() => setSelectedMuni(null)}
        />
      )}
    </div>
  );
};
