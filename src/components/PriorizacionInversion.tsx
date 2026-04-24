import React, { useState, useMemo } from 'react';
import { DepartmentRisk, PrioritizationCriteria, Project } from '../types';
import { calculateDepartmentPriority, suggestInvestmentStrategy, simulateRedistribution, generatePrioritizedProjectList } from '../services/prioritizationService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sliders, Map, List, AlertTriangle, TrendingUp, Download, ShieldAlert, Target, DollarSign, Info, X } from 'lucide-react';

interface Props {
  projects: Project[];
  departmentsData: DepartmentRisk[];
}

export const PriorizacionInversion: React.FC<Props> = ({ projects, departmentsData }) => {
  const [criteria, setCriteria] = useState<PrioritizationCriteria>({
    riskLevelWeight: 40,
    populationWeight: 30,
    investmentWeight: 20,
    disasterHistoryWeight: 10
  });

  const [simulationBudget, setSimulationBudget] = useState<number>(50000000000); // 50B default
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const prioritizedDepartments = useMemo(() => {
    return calculateDepartmentPriority(departmentsData, criteria);
  }, [departmentsData, criteria]);

  const strategy = useMemo(() => {
    return suggestInvestmentStrategy(prioritizedDepartments);
  }, [prioritizedDepartments]);

  const simulationResults = useMemo(() => {
    return simulateRedistribution(prioritizedDepartments, simulationBudget);
  }, [prioritizedDepartments, simulationBudget]);

  const prioritizedProjects = useMemo(() => {
    return generatePrioritizedProjectList(projects, prioritizedDepartments);
  }, [projects, prioritizedDepartments]);

  const handleWeightChange = (key: keyof PrioritizationCriteria, value: number) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Departamento,Riesgo,Poblacion,Inversion,Score Prioridad,Ranking\n"
      + prioritizedDepartments.map(d => `${d.name},${d.riskIndex},${d.population},${d.investment},${d.priorityScore},${d.rank}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "priorizacion_departamentos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProjects = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Proyecto,Departamento,Estado,Avance Fisico,Score Prioridad\n"
      + prioritizedProjects.map(p => `"${p.project.nombre}",${p.project.departamento},${p.project.estado},${p.project.avanceFisico},${p.priorityScore}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "priorizacion_proyectos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Motor de Priorización de Inversión</h2>
          <p className="text-slate-600">Análisis multicriterio para la asignación eficiente de recursos.</p>
        </div>
        <button 
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download size={18} />
          Exportar Decisiones
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuración de Pesos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="text-indigo-600" size={20} />
            <h3 className="font-semibold text-slate-800">Configuración de Pesos (%)</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Nivel de Riesgo</span>
                <span>{criteria.riskLevelWeight}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={criteria.riskLevelWeight}
                onChange={(e) => handleWeightChange('riskLevelWeight', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Población Expuesta</span>
                <span>{criteria.populationWeight}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={criteria.populationWeight}
                onChange={(e) => handleWeightChange('populationWeight', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Déficit de Inversión</span>
                <span>{criteria.investmentWeight}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={criteria.investmentWeight}
                onChange={(e) => handleWeightChange('investmentWeight', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                <span>Histórico de Desastres</span>
                <span>{criteria.disasterHistoryWeight}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={criteria.disasterHistoryWeight}
                onChange={(e) => handleWeightChange('disasterHistoryWeight', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm font-bold">
                <span>Total:</span>
                <span className={
                  (criteria.riskLevelWeight + criteria.populationWeight + criteria.investmentWeight + criteria.disasterHistoryWeight) !== 100 
                  ? "text-rose-600" : "text-emerald-600"
                }>
                  {criteria.riskLevelWeight + criteria.populationWeight + criteria.investmentWeight + criteria.disasterHistoryWeight}%
                </span>
              </div>
              {(criteria.riskLevelWeight + criteria.populationWeight + criteria.investmentWeight + criteria.disasterHistoryWeight) !== 100 && (
                <p className="text-xs text-rose-500 mt-1">Los pesos deberían sumar 100% para un análisis equilibrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sugerencia Automática */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-indigo-300">
              <ShieldAlert size={20} />
              <h3 className="font-semibold uppercase tracking-wider text-sm">Sugerencia Estratégica de la IA</h3>
            </div>
            
            {strategy ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-3xl font-black text-white mb-1">Prioridad 1: {strategy.primaryTarget}</h4>
                  <p className="text-indigo-200 text-sm leading-relaxed max-w-2xl">
                    {strategy.reasoning}
                  </p>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="text-emerald-400 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h5 className="font-bold text-white mb-1">Acción Recomendada</h5>
                      <p className="text-sm text-slate-300">{strategy.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>No hay datos suficientes para generar una estrategia.</p>
            )}
          </div>
        </div>
      </div>

      {/* Ranking y Simulación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <List size={18} className="text-indigo-600" />
              Ranking de Departamentos Prioritarios
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Rank</th>
                  <th className="px-6 py-3 font-semibold">Departamento</th>
                  <th className="px-6 py-3 font-semibold">Score Prioridad</th>
                  <th className="px-6 py-3 font-semibold">Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prioritizedDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">#{dept.rank}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{dept.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${dept.priorityScore}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs font-medium">{dept.priorityScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.riskIndex > 70 ? 'bg-rose-100 text-rose-700' :
                        dept.riskIndex > 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {dept.riskIndex}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulación de Redistribución */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              Simulación de Redistribución
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Presupuesto a simular:</span>
              <select 
                className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={simulationBudget}
                onChange={(e) => setSimulationBudget(Number(e.target.value))}
              >
                <option value={10000000000}>$10,000 Millones</option>
                <option value={50000000000}>$50,000 Millones</option>
                <option value={100000000000}>$100,000 Millones</option>
              </select>
            </div>
          </div>
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulationResults.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => `${(value / 1000000000).toFixed(0)}B`} />
                <YAxis dataKey="department" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)}
                />
                <Legend />
                <Bar dataKey="currentInvestment" name="Inversión Actual" stackId="a" fill="#94a3b8" />
                <Bar dataKey="simulatedAllocation" name="Asignación Simulada" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            * Gráfico muestra los 5 departamentos con mayor prioridad. La asignación simulada se distribuye proporcionalmente al score de prioridad.
          </p>
        </div>
      </div>

      {/* Lista Priorizada de Proyectos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Lista Priorizada de Proyectos (Top 5)
            </h3>
            <p className="text-sm text-slate-500 mt-1">Proyectos sugeridos para intervención inmediata basados en el ranking territorial y estado del proyecto.</p>
          </div>
          <button 
            onClick={exportProjects}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Download size={16} />
            Exportar Proyectos
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {prioritizedProjects.slice(0, 5).map((item, index) => (
              <div 
                key={item.project.id} 
                className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                onClick={() => setSelectedProject(item)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.project.nombre}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Map size={12}/> {item.project.departamento}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full">{item.project.estado}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-600">Score: {item.priorityScore}</div>
                    <div className="text-xs text-slate-500">Avance Físico: {item.project.avanceFisico}%</div>
                  </div>
                  <Info size={18} className="text-indigo-400" />
                </div>
              </div>
            ))}
            {prioritizedProjects.length === 0 && (
              <div className="text-center py-8 text-slate-500">No hay proyectos para priorizar.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Justificación */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white relative">
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Target size={24} className="text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Justificación de Priorización</h3>
              </div>
              <h4 className="text-indigo-100 font-medium text-lg">{selectedProject.project.nombre}</h4>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score de Prioridad</p>
                  <p className="text-2xl font-black text-indigo-600">{selectedProject.priorityScore.toFixed(1)}/100</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Estimado</p>
                  <p className="text-2xl font-black text-emerald-600">Alto</p>
                </div>
              </div>

              <div className="space-y-4 text-slate-600 leading-relaxed">
                <div className="flex gap-4">
                  <div className="mt-1 p-1 bg-indigo-50 text-indigo-600 rounded-lg h-fit">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Contexto de Riesgo Crítico</h5>
                    <p className="text-sm">
                      El departamento de <strong>{selectedProject.project.departamento}</strong> presenta un índice de riesgo consolidado de {selectedProject.project.riesgoAntes || 85}/100. 
                      Este proyecto interviene directamente en la mitigación de amenazas por {selectedProject.project.linea || 'inundación'}, protegiendo a una población estimada de {selectedProject.project.poblacionBeneficiada?.toLocaleString() || 'N/A'} personas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 p-1 bg-amber-50 text-amber-600 rounded-lg h-fit">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Oportunidad de Ejecución</h5>
                    <p className="text-sm">
                      Con un avance físico del <strong>{selectedProject.project.avanceFisico}%</strong> y un estado de "{selectedProject.project.estado}", 
                      el modelo identifica este punto como el "momento de inflexión" donde una inyección de recursos o gestión acelerada 
                      evitará sobrecostos por retrasos y garantizará la entrega antes de la próxima temporada de lluvias.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 p-1 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Eficiencia de Inversión</h5>
                    <p className="text-sm">
                      A diferencia de otros proyectos en la región, este presenta una brecha de inversión del {((1 - (selectedProject.project.avanceFinanciero / 100)) * 100).toFixed(0)}%, 
                      siendo el más eficiente en términos de "Costo por Persona Protegida". Priorizar este proyecto maximiza el retorno social de cada peso invertido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Entendido, Proceder con Priorización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
