import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { ProjectData } from '../types';
import { Activity, DollarSign, FileText, Users, MapPin, AlertCircle, Calendar, TrendingUp, BarChart2, Map, ShieldAlert, Download, Layers } from 'lucide-react';

interface CentroControlSRRProps {
  projects: ProjectData[];
  onGenerateReport: (projectId: string) => void;
}

type TabType = 'detalle' | 'nacional' | 'comparativa';
type GroupBy = 'departamento' | 'linea';

export function CentroControlSRR({ projects, onGenerateReport }: CentroControlSRRProps) {
  const { state } = useProject();
  const [activeTab, setActiveTab] = useState<TabType>('detalle');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.project.id || '');
  const [compareIds, setCompareIds] = useState<string[]>([projects[0]?.project.id || '', projects[1]?.project.id || '']);
  const [groupBy, setGroupBy] = useState<GroupBy>('departamento');

  const selectedProject = projects.find(p => p.project.id === selectedProjectId);

  if (!projects.length) return <div className="p-8">No hay proyectos disponibles.</div>;

  // --- VISTA NACIONAL ---
  const groupedProjects = projects.reduce((acc, p) => {
    const key = groupBy === 'departamento' ? p.project.departamento : p.project.linea;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, ProjectData[]>);

  // --- DETALLE PROYECTO ---
  const renderDetalleProyecto = () => {
    if (!selectedProject) return null;

    const totalOpsCost = (selectedProject.ops || []).reduce((acc, ops) => {
      const start = new Date(ops.fechaInicio);
      const end = new Date(ops.fechaFin);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return acc + (ops.honorariosMensuales * (months > 0 ? months : 1));
    }, 0);

    const totalComisionesCost = (selectedProject.comisiones || []).reduce((acc, com) => acc + com.costoTotal, 0);
    const totalProjectCost = selectedProject.presupuesto.valorTotal + totalOpsCost + totalComisionesCost;

    const latestReport = selectedProject.interventoriaReports && selectedProject.interventoriaReports.length > 0
      ? [...selectedProject.interventoriaReports].sort((a, b) => b.semana - a.semana)[0]
      : null;

    const avanceFisico = latestReport ? latestReport.obraEjecutadaPct : selectedProject.project.avanceFisico;
    const avanceProgramado = latestReport ? latestReport.obraProgramadaPct : selectedProject.project.avanceProgramado;
    const desviacion = avanceFisico - avanceProgramado;
    const avanceFinanciero = (selectedProject.presupuesto.pagosRealizados / selectedProject.presupuesto.valorTotal) * 100;

    // Build timeline
    const timelineItems = [
      ...selectedProject.avances.map(t => ({ date: t.fecha, type: 'Seguimiento', title: `Reporte de Avance`, desc: t.observaciones })),
      ...selectedProject.alerts.map(a => ({ date: a.fecha, type: 'Alerta', title: `Alerta: ${a.tipo}`, desc: a.descripcion })),
      ...(selectedProject.interventoriaReports || []).map(r => ({ date: r.fechaFin, type: 'Interventoría', title: `Informe Semana ${r.semana}`, desc: `Avance: ${r.obraEjecutadaPct}%` }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> Avance Físico
            </div>
            <div className="text-2xl font-bold text-slate-900">{avanceFisico.toFixed(1)}%</div>
            <div className="text-xs text-slate-400 mt-1">Programado: {avanceProgramado.toFixed(1)}%</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
              <Activity size={16} className={desviacion < 0 ? "text-rose-500" : "text-emerald-500"} /> Desviación
            </div>
            <div className={`text-2xl font-bold ${desviacion < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {desviacion > 0 ? '+' : ''}{desviacion.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">Acumulada a la fecha</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
              <DollarSign size={16} className="text-blue-500" /> Avance Financiero
            </div>
            <div className="text-2xl font-bold text-slate-900">{avanceFinanciero.toFixed(1)}%</div>
            <div className="text-xs text-slate-400 mt-1">Pagos realizados</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" /> Alertas Activas
            </div>
            <div className="text-2xl font-bold text-slate-900">{selectedProject.alerts.filter(a => a.estado === 'Abierta').length}</div>
            <div className="text-xs text-slate-400 mt-1">En tiempo real</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" /> Riesgos Activos
            </div>
            <div className="text-2xl font-bold text-slate-900">{(selectedProject.riesgos || []).filter(r => r.estado === 'Activo').length}</div>
            <div className="text-xs text-slate-400 mt-1">Requieren mitigación</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="text-indigo-500" size={20} />
                Línea de Tiempo Completa
              </h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {timelineItems.map((item, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-slate-200 pb-4 last:pb-0">
                    <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${
                      item.type === 'Alerta' ? 'bg-amber-500' : 
                      item.type === 'Interventoría' ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}></div>
                    <p className="text-xs text-slate-500 font-medium mb-1">{item.date} - {item.type}</p>
                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Riesgos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="text-rose-500" size={20} />
                Matriz de Riesgos
              </h2>
              <div className="space-y-3">
                {(selectedProject.riesgos || []).map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900">{r.descripcion}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.estado === 'Activo' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.estado}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs mt-2">
                      <span className="bg-slate-200 px-2 py-1 rounded text-slate-700">Prob: {r.probabilidad}</span>
                      <span className="bg-slate-200 px-2 py-1 rounded text-slate-700">Imp: {r.impacto}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2"><strong>Mitigación:</strong> {r.planMitigacion}</p>
                  </div>
                ))}
                {!(selectedProject.riesgos?.length) && <p className="text-sm text-slate-500">No hay riesgos registrados.</p>}
              </div>
            </div>

            {/* Alertas */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} />
                Alertas en Tiempo Real
              </h2>
              <div className="space-y-3">
                {selectedProject.alerts.map(a => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-slate-900">{a.tipo}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        a.nivel === 'Alto' ? 'bg-rose-100 text-rose-700' : 
                        a.nivel === 'Medio' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {a.nivel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{a.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- VISTA NACIONAL ---
  const renderNacional = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setGroupBy('departamento')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${groupBy === 'departamento' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Por Departamento
            </button>
            <button 
              onClick={() => setGroupBy('linea')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${groupBy === 'linea' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Por Línea de Inversión
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedProjects).map(([groupName, projs]) => {
            const totalInversion = projs.reduce((acc, p) => acc + p.presupuesto.valorTotal, 0);
            const avgFisico = projs.reduce((acc, p) => acc + p.project.avanceFisico, 0) / projs.length;
            const totalAlertas = projs.reduce((acc, p) => acc + p.alerts.filter(a => a.estado === 'Abierta').length, 0);
            const totalRiesgos = projs.reduce((acc, p) => acc + (p.riesgos || []).filter(r => r.estado === 'Activo').length, 0);

            return (
              <div key={groupName} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">{groupName}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Proyectos</span>
                    <span className="font-bold text-slate-900">{projs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Inversión Total</span>
                    <span className="font-bold text-slate-900">${(totalInversion / 1000000).toFixed(1)}M</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-500">Avance Promedio</span>
                      <span className="font-bold text-slate-900">{avgFisico.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${avgFisico}%` }}></div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm">
                      <AlertCircle size={14} className="text-amber-500" />
                      <span className="text-slate-600">{totalAlertas} Alertas</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <ShieldAlert size={14} className="text-rose-500" />
                      <span className="text-slate-600">{totalRiesgos} Riesgos</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- COMPARATIVA ---
  const renderComparativa = () => {
    const p1 = projects.find(p => p.project.id === compareIds[0]);
    const p2 = projects.find(p => p.project.id === compareIds[1]);

    return (
      <div className="space-y-6">
        <div className="flex gap-6 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Proyecto 1</label>
            <select
              value={compareIds[0]}
              onChange={(e) => setCompareIds([e.target.value, compareIds[1]])}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {projects.map(p => <option key={p.project.id} value={p.project.id}>{p.project.nombre}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Proyecto 2</label>
            <select
              value={compareIds[1]}
              onChange={(e) => setCompareIds([compareIds[0], e.target.value])}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {projects.map(p => <option key={p.project.id} value={p.project.id}>{p.project.nombre}</option>)}
            </select>
          </div>
        </div>

        {p1 && p2 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 w-1/3">Métrica</th>
                  <th className="p-4 font-bold text-slate-900 w-1/3 border-l border-slate-200">{p1.project.id}</th>
                  <th className="p-4 font-bold text-slate-900 w-1/3 border-l border-slate-200">{p2.project.id}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-sm text-slate-600 font-medium">Estado</td>
                  <td className="p-4 border-l border-slate-200">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p1.project.estado === 'En ejecución' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{p1.project.estado}</span>
                  </td>
                  <td className="p-4 border-l border-slate-200">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p2.project.estado === 'En ejecución' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{p2.project.estado}</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-sm text-slate-600 font-medium">Avance Físico vs Programado</td>
                  <td className="p-4 border-l border-slate-200">
                    <div className="text-lg font-bold text-slate-900">{p1.project.avanceFisico}% <span className="text-sm font-normal text-slate-500">/ {p1.project.avanceProgramado}%</span></div>
                    <div className={`text-xs mt-1 ${p1.project.avanceFisico - p1.project.avanceProgramado < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      Desviación: {(p1.project.avanceFisico - p1.project.avanceProgramado).toFixed(1)}%
                    </div>
                  </td>
                  <td className="p-4 border-l border-slate-200">
                    <div className="text-lg font-bold text-slate-900">{p2.project.avanceFisico}% <span className="text-sm font-normal text-slate-500">/ {p2.project.avanceProgramado}%</span></div>
                    <div className={`text-xs mt-1 ${p2.project.avanceFisico - p2.project.avanceProgramado < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      Desviación: {(p2.project.avanceFisico - p2.project.avanceProgramado).toFixed(1)}%
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-sm text-slate-600 font-medium">Inversión Total</td>
                  <td className="p-4 border-l border-slate-200 font-medium text-slate-900">${(p1.presupuesto.valorTotal / 1000000).toFixed(1)}M</td>
                  <td className="p-4 border-l border-slate-200 font-medium text-slate-900">${(p2.presupuesto.valorTotal / 1000000).toFixed(1)}M</td>
                </tr>
                <tr>
                  <td className="p-4 text-sm text-slate-600 font-medium">Alertas Activas</td>
                  <td className="p-4 border-l border-slate-200 font-bold text-amber-600">{p1.alerts.filter(a => a.estado === 'Abierta').length}</td>
                  <td className="p-4 border-l border-slate-200 font-bold text-amber-600">{p2.alerts.filter(a => a.estado === 'Abierta').length}</td>
                </tr>
                <tr>
                  <td className="p-4 text-sm text-slate-600 font-medium">Riesgos Activos</td>
                  <td className="p-4 border-l border-slate-200 font-bold text-rose-600">{(p1.riesgos || []).filter(r => r.estado === 'Activo').length}</td>
                  <td className="p-4 border-l border-slate-200 font-bold text-rose-600">{(p2.riesgos || []).filter(r => r.estado === 'Activo').length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="text-indigo-600" />
              Centro de Control SRR
            </h1>
            <p className="text-slate-500 mt-1">Panel maestro de integración y seguimiento nacional</p>
          </div>
          {activeTab === 'detalle' && (
            <div className="flex gap-4 items-center">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              >
                {projects.map(p => (
                  <option key={p.project.id} value={p.project.id}>
                    {p.project.id} - {p.project.nombre}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => onGenerateReport(selectedProjectId)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Download size={16} />
                Generar Informe
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('detalle')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'detalle' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2"><FileText size={16} /> Detalle Proyecto</div>
          </button>
          <button
            onClick={() => setActiveTab('nacional')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'nacional' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2"><Map size={16} /> Vista Nacional</div>
          </button>
          <button
            onClick={() => setActiveTab('comparativa')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comparativa' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2"><BarChart2 size={16} /> Comparativa</div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'detalle' && renderDetalleProyecto()}
        {activeTab === 'nacional' && renderNacional()}
        {activeTab === 'comparativa' && renderComparativa()}
      </div>
    </div>
  );
}
